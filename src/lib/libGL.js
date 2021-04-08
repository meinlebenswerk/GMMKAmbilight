

// WebGL helpers
export const createShader = (gl, source, type) => {
  let shader_type;
  switch(type) {
    case 'frag':
      shader_type = gl.FRAGMENT_SHADER;
      break;
    default:
    case 'vert':
      shader_type = gl.VERTEX_SHADER;
      break;
  }

  const shader = gl.createShader(shader_type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const compile_msg = gl.getShaderInfoLog(shader);
  if(compile_msg) console.log(`${type} shader compiled with error: ${compile_msg}`)

  return shader;
};

export const createTexture = (gl, size) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.offsetWidth, size.offsetHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  return texture;
};