


export const parseKeymap = (data) => {
  const lines = data.split('\n');
  const keys = lines.filter((e, i) => i%2 === 0).map(l => l.split(' ').filter(e => !!e)).filter(e => !!e.length);
  const codes = lines.filter((e, i) => i%2 === 1).map(l => l.split(' ').filter(e => !!e)).filter(e => !!e.length);
  // const map = []
  const ydim = Math.min(keys.length, codes.length);
  const xdim = Math.min(...keys.map(e => e.length), ...codes.map(e => e.length));
  
  
  // const map = new Array(xdim).fill(new Array(ydim).fill(null));
  for(let x=0; x<xdim; x++){
    for(let y=0; y<ydim; y++){
      const key = keys[x][y];
      const code = codes[x][y];

      console.log(key, code);
    }
  }
}