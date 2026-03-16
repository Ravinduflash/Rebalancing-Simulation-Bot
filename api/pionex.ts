// Stateful mock price tracker for any assets missing from both API endpoints
const mockPrices: Record<string, number> = {};

export async function getPrices(): Promise<Record<string, number>> {
  try {
    const prices: Record<string, number> = {};
    const btcPairs: Record<string, number> = {};
    const ethPairs: Record<string, number> = {};

    // 1. Fetch Standard Spot Tickers
    try {
      const response = await fetch('https://api.pionex.com/api/v1/market/tickers');
      const data = await response.json();
      if (data.result && data.data && data.data.tickers) {
        for (const ticker of data.data.tickers) {
          if (ticker.symbol.endsWith('_USDT')) {
            const coin = ticker.symbol.replace('_USDT', '');
            prices[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_USDC')) {
            const coin = ticker.symbol.replace('_USDC', '');
            if (!prices[coin]) prices[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_BTC')) {
            const coin = ticker.symbol.replace('_BTC', '');
            btcPairs[coin] = parseFloat(ticker.close);
          } else if (ticker.symbol.endsWith('_ETH')) {
            const coin = ticker.symbol.replace('_ETH', '');
            ethPairs[coin] = parseFloat(ticker.close);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching Spot Tickers:', e);
    }
    
    // 2. Fetch Perpetual Futures Indexes (for Tokenized Stocks like AAPLX, TSLAX, QQQX)
    try {
      const respIndex = await fetch('https://api.pionex.com/api/v1/market/indexes');
      const dataIndex = await respIndex.json();
      
      if (dataIndex.result && dataIndex.data && dataIndex.data.indexes) {
        for (const indexData of dataIndex.data.indexes) {
          if (indexData.symbol.endsWith('_USDT_PERP')) {
            const coin = indexData.symbol.replace('_USDT_PERP', '');
            // Only add if not already covered by spot
            if (!prices[coin]) {
              prices[coin] = parseFloat(indexData.indexPrice);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching PERP Indexes:', e);
    }

    prices['USDT'] = 1.0;
    prices['USDC'] = 1.0;

    // Calculate USD prices for assets that only have BTC or ETH pairs
    const btcPrice = prices['BTC'] || 0;
    const ethPrice = prices['ETH'] || 0;

    if (btcPrice > 0) {
      for (const [coin, priceInBtc] of Object.entries(btcPairs)) {
        if (!prices[coin]) prices[coin] = priceInBtc * btcPrice;
      }
    }

    if (ethPrice > 0) {
      for (const [coin, priceInEth] of Object.entries(ethPairs)) {
        if (!prices[coin]) prices[coin] = priceInEth * ethPrice;
      }
    }
    
    // Add mock prices for ATMs, Tokenized Stocks, Indices, and other requested assets if they still don't exist
    const requestedAssets = [
      "BTC", "ETH", "mBTC", "mETH", "Other coins", "A2Z", "AAOIX", "AAPLX", "AAVE", "AAX", "ACE", "ACH", "ACM", "ACT", "ACX", "ADA", "ADBEX", "ADIX", "AERGO", "AERO", "AEVO", "AGLD", "AITECH", "AI", "AKT", "ALBX", "ALCX", "ALEO", "ALGO", "ALICE", "ALIEN", "ALLO", "ALPINE", "ALT", "AMATX", "AMDX", "AMZNX", "ANDY", "ANIME", "ANKR", "APEPE", "APEX", "APE", "API3", "APLDX", "APT", "ARB", "ARC", "ARDR", "ARKM", "ARMX", "ARPA", "AR", "ASMLX", "ASR", "ASTER", "ASTR", "ASTSX", "ATA", "ATH", "ATOM", "AUCTION", "AUDIO", "AVAIL", "AVAX", "AVA", "AVGOX", "AVNT", "AWE", "AXL", "AXS", "AZNX", "AZTEC", "A", "B2", "BABAX", "BABYDOGE", "BABY", "BACX", "BANANA", "BAND", "BANK", "BAN", "BARD", "BAR", "BAT", "BAX", "BBAIX", "BB", "BCH", "BDX", "BEAMX", "BELIEVE", "BEL", "BERA", "BERT", "BEX", "BICO", "BIDUX", "BIGTIME", "BIGTROUT", "BIO", "BIRB", "BITFX", "BITOX", "BLESS", "BLSHX", "BLUE", "BLUR", "BMNRX", "BNB", "BNOX", "BNT", "BN", "BOME", "BONK", "BRETT", "BREV", "BRKBX", "BROCCOLI", "BTBTX", "BTR", "BUNNIE", "C98", "CAKE", "CAMP", "CANX", "CATX", "CAT", "CCJX", "CC", "CELO", "CELR", "CETUS", "CFG", "CFX", "CGPT", "CHILLGUY", "CHR", "CHZ", "CIFRX", "CITY", "CKB", "CLANKER", "CLSKX", "COAI", "COINDEPO", "COINX", "COMP", "COOKIE", "COPXX", "COPX", "CORE", "COSTX", "COS", "COTI", "CPERX", "CPOOL", "CRCLX", "CRO", "CRV", "CRWDX", "CRWVX", "CSCOX", "CSPR", "CTK", "CTSI", "CVC", "CVXX", "CVX", "CYBER", "DAI", "DALX", "DASH", "DCR", "DEEP", "DEGO", "DELLX", "DENT", "DEXE", "DGB", "DIAX", "DIA", "DJTX", "DODO", "DOGE", "DOGS", "DOLO", "DOT", "DUSK", "DYDX", "DYM", "D", "EDENA", "EDU", "EGLD", "EIGEN", "8BALL", "ELIZAOS", "ELSA", "ENA", "ENJ", "ENPHX", "ENSO", "ENS", "EPIC", "EPT", "ERA", "ESP", "ES", "ETC", "ETHFI", "ETHW", "ETNX", "EUL", "EURQ", "EURR", "EWJX", "EWYX", "FARM", "FARTCOIN", "FCXX", "FET", "FF", "FGPT", "FIGX", "FIL", "FIO", "FLNCX", "FLOKI", "FLR", "FLUID", "FLUX", "FORM", "FRAX", "FTT", "FUN", "GALA", "GEMIX", "GEX", "GHOAD", "GLM", "GLWX", "GLXYX", "GMEX", "GMT", "GMX", "GM", "GOAT", "GODS", "GOOGLX", "GRASS", "GRT", "GT", "GUN", "G", "HAEDAL", "HBAR", "HEMI", "HFT", "HIGH", "HIMSX", "HMSTR", "HOME", "HOODX", "HOOK", "HOPPY", "HSK", "HTX", "HUMA", "HWMX", "HYPER", "HYPE", "H", "IBITX", "IBMX", "ICNT", "ICP", "ICX", "IDEX", "ID", "IKA", "ILMNX", "ILV", "IMX", "1INCH", "INIT", "INJ", "INTCX", "IONQX", "IOST", "IOTA", "IOTX", "IO", "IP", "IQ", "IRENX", "ISRGX", "ITAX", "IWMX", "JASMY", "JDX", "JITOSOL", "JNJX", "JOE", "JPMX", "JTO", "JUP", "JUV", "KAIA", "KAITO", "KAS", "KAVA", "KERNEL", "KEYSX", "KGEN", "KITE", "KLACX", "KMNO", "KNC", "KOX", "KSM", "L3", "LAB", "LACX", "LAT", "LAYER", "LAZIO", "LA", "LDO", "LIT", "LINEA", "LINK", "LISTA", "LITEX", "LIX", "LLYX", "LMTX", "LNGX", "LPT", "LQTY", "LRCXX", "LRC", "LSK", "LTC", "LUNA", "LUNC", "MAGIC", "MANA", "MANTRA", "MARAX", "MASK", "MAVIA", "MAV", "MBL", "MBOX", "MCDX", "MDT", "MEMEFI", "MEME", "MERL", "METAX", "METIS", "MET", "MEW", "MFG", "MINA", "MIRROR", "MMT", "MNDE", "MNT", "MOCA", "MOG", "MON", "MOODENG", "MORPHO", "MOVE", "MPX", "MRVLX", "MSFTX", "MSTRX", "MTL", "MUSA", "MUX", "NAORIS", "NAVX", "NEAR", "NEEX", "NEIRO", "NEON", "NEO", "NEWT", "NEXO", "NFLXX", "NFP", "NFT", "NIGHT", "NIL", "NIOX", "NLRX", "NMR", "NOCX", "NOKX", "NOM", "NOT", "NS", "NUX", "NVDAX", "NVOX", "NXPC", "OGN", "OG", "OKB", "OKLOX", "OL", "ONDO", "ONDSX", "ONE", "ONG", "ONT", "EDEN", "OPENX", "OPEN", "OP", "ORCA", "ORCLX", "ORDER", "ORDI", "OSMO", "OXT", "OXYX", "PAAL", "PALLX", "PARTI", "PAXG", "PDDX", "PEAQ", "PENDLE", "PENGU", "PEOPLE", "PEPE", "PFEX", "PGX", "PHA", "PHB", "PIVX", "PIXEL", "PI", "PLPA", "PLTRX", "PLUME", "PNUT", "POLYX", "POL", "POND", "PONKE", "PORTAL", "PORTO", "POWR", "PPLTX", "PRIME", "PROM", "PROVE", "PRO", "PSG", "PUMP", "PUNDIX", "PYPLX", "PYR", "PYTH", "QCOMX", "QKC", "QNT", "QQQX", "QTUM", "RAD", "RARE", "RATS", "RAVE", "RAY", "RBLXX", "RDDTX", "RDNT", "RECALL", "RED", "REMXX", "RENDER", "REQ", "RESOLV", "RGTIX", "RIF", "RIOTX", "RIO", "RKLBX", "RLC", "RNBW", "RON", "ROSE", "RPL", "RSR", "RSS3", "RTXX", "RUNE", "RVN", "RWAHUB", "SAGA", "SAHARA", "SAND", "SANTOS", "SAROS", "SATSX", "SATS", "SBETX", "SBUXX", "SCA", "SCRT", "SEI", "SEND", "SFP", "SHIB", "SHM", "SIGN", "SISC", "SKL", "SKR", "SKY", "SLBX", "SLVX", "SMCIX", "SMHX", "SMRX", "SNDKX", "SNEK", "SNOWX", "SNPSX", "SNX", "SOFIX", "SOLV", "SOL", "SOMI", "SOON", "SOSO", "SOXSX", "SOXXX", "SPELL", "SPK", "SPORTFUN", "SPYX", "SSV", "STABLE", "STBL", "STG", "STM", "STORJ", "STO", "STRAX", "STRK", "STXX", "STX", "SUI", "SUN", "SUPER", "SUSHI", "SXT", "SYN", "SYRUP", "SYS", "S", "TAC", "TAI", "TAO", "TA", "TCOMX", "TEL", "TFUEL", "THETA", "THE", "THQ", "TIA", "TKO", "TLM", "TNSR", "TON", "TOSHI", "TOWNS", "TRB", "TREE", "TRUMP", "TRUST", "TRU", "TRX", "TSEMX", "TSLAX", "TSMX", "TST", "TURBO", "2Z", "TWT", "TXC", "TXNX", "UAI", "UAMYX", "UBERX", "UDS", "UMA", "UNGX", "UNHX", "UNI", "URAX", "USARX", "USAT", "USD1", "USDC", "USDQ", "USDR", "USOX", "USTC", "USUAL", "US", "UTK", "UTT", "UXLINK", "VANA", "VEREM", "VET", "VFY", "VIC", "VINE", "VIRTUAL", "VRTX", "VSTX", "VTHO", "VTIX", "VX", "WAL", "WAN", "WAXP", "WBTC", "WCT", "WDCX", "WET", "WIF", "WIN", "WLD", "WLFI", "WMTX", "WOLF", "WOO", "WULFX", "W", "XAI", "XAN", "XAUt", "XCH", "XCN", "XDC", "XEC", "XION", "XLKX", "XLM", "XMEX", "XNY", "XOMX", "XPEVX", "XPL", "XRP", "XTZ", "XUSD", "XVG", "XVS", "XYO", "XYZX", "YB", "YFI", "YGG", "YZY", "ZBCN", "ZBT", "ZEC", "ZENT", "ZEN", "0G", "ZETA", "ZIG", "ZIL", "ZKC", "ZKJ", "ZKP", "ZKSYNC", "ZORA", "ZRO", "ZRX", "BTC1S", "BTC2S", "BTC2L", "BTC3S", "BTC3L", "BTC5S", "BTC5L", "ETH1S", "ETH2S", "ETH2L", "ETH3S", "ETH3L", "ETH5S", "ETH5L"
    ];
    
    for (const symbol of requestedAssets) {
      if (!prices[symbol]) {
        // Implement 0.2% random walk for missing assets to simulate natural market movement
        if (!mockPrices[symbol]) {
          mockPrices[symbol] = 100.0; // Initialize base price
        } else {
          const changePercent = (Math.random() * 0.004) - 0.002; // -0.2% to +0.2%
          mockPrices[symbol] = mockPrices[symbol] * (1 + changePercent);
        }
        prices[symbol] = mockPrices[symbol];
      }
    }

    return prices;
  } catch (error) {
    console.error('Error fetching Pionex prices:', error);
    return {};
  }
}
