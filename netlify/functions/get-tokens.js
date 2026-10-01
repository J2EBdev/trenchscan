exports.handler = async function(event, context) {
  try {
    // 1. Get latest token profiles
    const profilesRes = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    const profiles = await profilesRes.json();

    // Filter Solana tokens
    const solanaProfiles = profiles
      .filter(t => t.chainId === 'solana')
      .slice(0, 12);

    if (solanaProfiles.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([])
      };
    }

    // 2. Get more details for these tokens
    const addresses = solanaProfiles.map(t => t.tokenAddress).join(',');
    const detailsRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${addresses}`);
    const detailsData = await detailsRes.json();

    // detailsData is usually an array of pairs
    const pairs = Array.isArray(detailsData) ? detailsData : [];

    // Combine the data
    const enriched = solanaProfiles.map(profile => {
      const pair = pairs.find(p => 
        p.baseToken?.address?.toLowerCase() === profile.tokenAddress.toLowerCase()
      );

      return {
        address: profile.tokenAddress,
        name: pair?.baseToken?.name || profile.description?.slice(0, 40) || 'Unknown',
        symbol: pair?.baseToken?.symbol || '???',
        icon: profile.icon || pair?.baseToken?.image || null,
        priceUsd: pair?.priceUsd || null,
        liquidity: pair?.liquidity?.usd || null,
        marketCap: pair?.marketCap || pair?.fdv || null,
        createdAt: pair?.pairCreatedAt || null,
        url: profile.url || `https://dexscreener.com/solana/${profile.tokenAddress}`
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(enriched)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', message: error.message })
    };
  }
};
