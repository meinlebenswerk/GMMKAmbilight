export const gcd = (a, b) => {
  // console.log(`GCD ${a}, ${b}`)
  if(b === 0) return a;
  return gcd(b, a%b);
}

export const lcm = (a, b) => {
  return (Math.abs(a) / gcd(a, b)) * Math.abs(b);
}

export const minMultF2I = (num) => {
  const nstr = num.toString(10);
  const ndecimal = nstr.split('.')[1]?.length ?? 0;
  if(ndecimal === 0) return 1;
  const fraction_den = 10**ndecimal;
  return fraction_den / gcd(num*fraction_den, fraction_den);
}
