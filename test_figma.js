const url = 'https://api.figma.com/v1/files/S1KYsvXioyG30Pum4A8kH8/nodes?ids=35:1553';
const headers = { 'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN };

fetch(url, { headers })
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
