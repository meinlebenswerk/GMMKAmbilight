/**
 * The file enables `@/store/index.js` to import all vuex modules
 * in a one-shot manner. There should not be any reason to edit this file.
 */

 const files = require.context('.', false, /\.js$/);
 const modules = {};
 
 files.keys().forEach((key) => {
   if (key === './index.js') return;
 
   const moduleKey = key.replace(/(\.\/|\.js)/g, '');
   modules[moduleKey] = files(key).default;
 });
 
 export default modules;
 