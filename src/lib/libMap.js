
import oem_fullsize_iso from '@/assets/oem_iso_fullsize.json'
import oem_fullsize_iso_map from '@/assets/iso_fullsize_default_layout.json'
import gmmk_iso_map from '!raw-loader!@/assets/keymap-DE-ISO-fullsize.txt'

import { lcm, minMultF2I } from '@/lib/utils'

// console.log(oem_fullsize_iso)

// const default_key_width = 31.76;
// const default_key_height = 31.76;

// Helpers

const deduplicateArray = (array) => {
  const deduped = []
  for(const el of array) {
    if(deduped.includes(el)) continue;
    deduped.push(el)
  }
  return deduped;
}

// Mathematical helpers


// converts the given float into the smallest integer without loss of precision
// const F2I_swl = (num) => {
//   return minMultF2I(num) * num;
// }

const _getKeyboardMapfromQMKJson = (descriptor, map) => {
  // console.log(descriptor)
  const { keyboards } = descriptor;
  const keyboard_names = Object.keys(keyboards);
  
  const kbd_name = keyboard_names[0];
  const { layouts } = keyboards[kbd_name];
  const layout_names = Object.keys(layouts);

  return layouts[layout_names[0]].layout.map((e, i) => {
    // Override the label with the defaults, for debugging.
    const label = map.layers[0][i];
    return { ...e, label }
  });
}

const augmentQMKLayout = (qmkLayout) => {

  const yValues = deduplicateArray(qmkLayout.map(e => e.y));
  // const xValues = deduplicateArray(simplifiedLayout.map(e => e.x));

  const qmkMatrix  = yValues.map((y, y_index) => qmkLayout.filter(e => e.y === y).map((e, x_index) => ({x_index, y_index, ...e})));
  return qmkMatrix;
}

const parseTextKeymap = (map) => {
  const elements = map.split('\n')
    .map(r => r.split(/\s+/).filter(e => !!e))
    .filter(e => !!e.length);

  // const key_rows = elements.filter((e, i) => i%2 === 0);
  const index_rows = elements.filter((e, i) => i%2 === 1);
  
  // merge the two:
  // actually, do we need to know the key's names?
  // I think not

  const key_matrix = []

  const size_x = Math.max(...index_rows.map(e => e.length))
  const size_y = index_rows.length;

  // console.log(`Your keyboard essentially is a wonky ${size_x}x${size_y} monitor :)`)
  for(let y = 0; y < size_y; y++) {
    const row = []
    for(let x = 0; x < size_x; x++) {
      if(y === 2 && x === 13) console.log(index_rows[y][x])
      const gmmk_index = (index_rows[y].length > x) ? parseInt(index_rows[y][x]) : -1;
      const map_element = {x_index: x, y_index: y, gmmk_index}
      row.push(map_element)
    }
    key_matrix.push(row);
  }

  key_matrix.shape = [size_y, size_x];

  return key_matrix;
}
  

export const generateMap = () => {

  // console.log('mapping...');

  // While the pure GMMK ISO map gives us a rough estimated where the keys are
  // This cannot be used for proper graphics.
  // Since the keys are not simply linearly spaced in x and y.

  // First the GMMK map is used to get key a key-position matrix
  // This is used with the ISO OEM map to get the actual positions

  // Which then can be used to generat a bitmap and a key-mapping for that bitmap :)

  // Load and matrixify the gmmk keymap
  const gmmk_keymap = parseTextKeymap(gmmk_iso_map);

  // load and matrxify the corresponding QMK keymap
  const qmk_layout = _getKeyboardMapfromQMKJson(oem_fullsize_iso, oem_fullsize_iso_map);
  const qmkMatrix = augmentQMKLayout(qmk_layout)

  // match up the matrixes
  const combinedMatrix = []
  for(let y=0; y<gmmk_keymap.shape[0]; y++){
    const combined_row = []
    for(let x=0; x<gmmk_keymap.shape[1]; x++) {
      const { gmmk_index } = gmmk_keymap[y][x];
      const qmkElement = qmkMatrix[y][x];
      const qmkMapperExists = !!qmkElement;

      const key_x = (qmkMapperExists)? qmkElement.x: -1;
      const key_y = (qmkMapperExists)? qmkElement.y: -1;
      const key_w = (qmkMapperExists)? qmkElement.w: -1;
      const key_h = (qmkMapperExists)? qmkElement.h ?? 1: -1;
      const label = (qmkMapperExists)? qmkElement.label : '';

      const center = { x: key_x + (key_w/2), y: key_y + (key_h/2)}
      
      const keyInfo = { x: key_x, y: key_y, w:key_w, h: key_h, label, gmmk_index, center};
      combined_row.push(keyInfo)
    }
    combinedMatrix.push(combined_row);
  }

  combinedMatrix.shape = gmmk_keymap.shape;

  // now that we have a combined mapping matrix
  // generate a bitmap, which acts as a key-mask
  // this would be a bitmap, which needs to be scaled appropriately

  // return a buffer, which maps every keycode, to a pixel-position from 0-1.
  const allKeys = combinedMatrix.flat()
    // filter out unused keys
    .filter(e => e.gmmk_index !== -1)
    // calculate bounding-rect
    .map(e => {
      const { x, y, w, h } = e;
      const boundingRect = [{ x, y }, { x: x+w, y }, { x: x+w, y: y+h }, { x, y: y+h }]
      const center = { x: x + (w/2), y: y + (h/2)}
      return {...e, boundingRect, center}
    })
  
  // since we know all the keys sizes (w & h) and positions
  
  // calculate the keyboard's bounding-box.
  const min_x = Math.min(...allKeys.map(e => e.x));
  const max_x = Math.max(...allKeys.map(e => e.x + e.w));

  const min_y = Math.min(...allKeys.map(e => e.y));
  const max_y = Math.max(...allKeys.map(e => e.y + e.h));

  // console.log(min_x, max_x, min_y, max_y);
  // console.log(minMultF2I(min_x), minMultF2I(max_x), minMultF2I(min_y), minMultF2I(max_y));

  // console.log(lcm(2,1), lcm(1, 2));

  const bitmap_scl_x = lcm(minMultF2I(min_x), minMultF2I(max_x))
  const bitmap_scl_y = lcm(minMultF2I(min_y), minMultF2I(max_y))
  const kbd_bitmap_size = { x: (max_x - min_x) * bitmap_scl_x, y: (max_y - min_y) * bitmap_scl_y, bitmap_scl_x, bitmap_scl_y };
  // console.log(kbd_bitmap_size)

  // generate the bitmap-mask:
  
  // Save statistics into the combined matrix
  combinedMatrix.min_x = min_x;
  combinedMatrix.max_x = max_x;
  combinedMatrix.min_y = min_y;
  combinedMatrix.max_y = max_y;
  

  // console.log(allKeys)
  return {allKeys, combinedMatrix, kbd_bitmap_size, gmmk_keymap};
}