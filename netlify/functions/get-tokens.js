exports.handler = async function(event, context) {
  try {
    const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch from DexScreener' })
      };
    }

    const data = await response.json();

    // Only return Solana tokens and limit to 15
    const solanaTokens = data
      .filter(token => token.chainId === 'solana')
      .slice(0, 15);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(solanaTokens)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', message: error.message })
    };
  }
};
