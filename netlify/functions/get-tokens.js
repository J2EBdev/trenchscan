exports.handler = async function(event, context) {
  try {
    // Get latest token profiles
    const profilesRes = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    const profiles = await profilesRes.json();

    const solanaProfiles = profiles
      .filter(t => t.chainId === 'solana')
      .slice(0, 15);

    if (solanaProfiles.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([])
      };
    }

    // Get detailed pair data
    const addresses = solanaProfiles.map(t => t.tokenAddress).join(',');
    const detailsRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${addresses}`);
    const details = await detailsRes.json();

    // details can be array of pairs
    const pairs = Array.isArray(details) ? details : (details.pairs || []);

    const enriched = solanaProfiles.map(profile => {
      // Find matching pair
      let pair = pairs.find(p => 
        p.baseToken && p.baseToken.address && 
        p.baseToken.address.toLowerCase() === profile.tokenAddress.toLowerCase()
      );

      // Fallback: sometimes the structure is different
      if (!pair && Array.isArray(details)) {
        pair = details.find(p => 
          p.baseToken?.address?.toLowerCase() === profile.tokenAddress.toLowerCase()
        );
      }

      const name = pair?.baseToken?.name || profile.description?.slice(0, 35) || 'Unknown';
      const symbol = pair?.baseToken?.symbol || '???';

      return {
        address: profile.tokenAddress,
        name: name,
        symbol: symbol,
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
