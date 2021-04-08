
// copied and adapted from https://github.com/paulguy/gmmkctl

import HID from 'node-hid';

const supportedVIDs = [ 3141 ];

export const GMMK_CMD_START = 0x01
export const GMMK_CMD_END = 0x02
export const GMMK_CMD_KEYCOLORS = 0x11

export const GMMK_CMD_SUBCOMMAND = 6
export const GMMK_SUBCMD_CMD_OFFSET = 4
export const GMMK_SUBCMD_ARG_OFFSET = 8

export const GMMK_PACKET_SIZE = 64
export const GMMK_COMMAND_OFFSET = 3;
export const GMMK_MAX_KEY = 126;
export const GMMK_SUM_OFFSET = 1;

export const GMMK_KEYCOLORS_COUNT_OFFSET = 4
export const  GMMK_KEYCOLORS_START_OFFSET = 5
export const  GMMK_KEYCOLORS_DATA_OFFSET = 8
export const  GMMK_KEYCOLORS_DATA_SIZE = Math.floor((GMMK_PACKET_SIZE - GMMK_KEYCOLORS_DATA_OFFSET)/3)*3;


// const commandBuffer = new Array(GMMK_PACKET_SIZE).fill(0);

// stolen from GMMKUtil
// I think the leading 4 is the report id
const _data_set_profile = [0x04,0xdd,0x03,0x04,0x2c,0x00,0x00,0x00,0x55,0xaa,0xff,0x02,0x45,0x0c,0x2f,0x65,0x00,0x01,0x00,0x08,0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x08,0x07,0x09,0x0b,0x0a,0x0c,0x0d,0x0e,0x0f,0x10,0x11,0x12,0x14,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00];

export const fillSingleColor = (color, n) => {
  // bound n from 0 - Maxkeys
  n = Math.min(GMMK_MAX_KEY, Math.max(n, 0));
  return new Array(n).fill(color);
}

export class GMMKInterface {
  constructor() {
    this.device = null;
    this.devices = HID.devices()
      .filter(device => supportedVIDs.includes(device.vendorId))
      // .filter(device => supportedPIDs.includes(device.productId))
      .filter(device => device.interface === 1 && device.usagePage === 65308);

    // Locally save the buffer:
    this.buffer = new Array(GMMK_PACKET_SIZE).fill(0);
  }

  async selectDevice(device) {
    const devicePath = device.path;
    this.device = new HID.HID(devicePath);
    return { device };
  }


  // TODO this has currently no error checking at all
  // This means the init state inside the store is essentially meaningless.
  async initializeKeyboard() {
    if(!this.device) return false;
    this.setProfile(1);
    this.setCustomMode();
    this.setRate(3);
    this.setDelay(0);
    return true;
  }

  _resetBuffer() {
    this.buffer.fill(0);
  }

  setCustomMode() {
    this.setMode(20);
  }

  setMode(mode) {
    this._resetBuffer();

    this.buffer[GMMK_COMMAND_OFFSET] = GMMK_CMD_SUBCOMMAND;
    this.buffer[GMMK_SUBCMD_CMD_OFFSET] = 0x01;
    this.buffer[GMMK_SUBCMD_ARG_OFFSET] = mode;

    // send data
    this._startCommand();
    this._write(this.buffer);
    this._endCommand();
  }

  // Public
  setProfile(profile) {
    if(!this.device) return;
    profile = Math.min(3, Math.max(1, profile));
    const message = [..._data_set_profile];
    message[18] = profile - 1;
    this._write(message);
  }

  setDelay(delay) {
    delay = Math.max(0, Math.min(delay, 0xff));
    this._resetBuffer();
    
    this._startCommand();
    this.buffer[GMMK_COMMAND_OFFSET] = GMMK_CMD_SUBCOMMAND;
    this.buffer[GMMK_SUBCMD_CMD_OFFSET] = 0x01;
    this.buffer[GMMK_SUBCMD_CMD_OFFSET + 1] = 0x02;
    this.buffer[GMMK_SUBCMD_ARG_OFFSET] = delay;
    this._write(this.buffer)
    this._endCommand();
  }

  setKeys(colors) {
    const start = 0;
    const count = colors.length;
    this._startCommand();

    // const keysPerTransfer = Math.floor(GMMK_KEYCOLORS_DATA_SIZE/3)
    this._resetBuffer();
    for(let i=0; i<count;) {
      this.buffer[0] = 0x04;
      this.buffer[GMMK_COMMAND_OFFSET] = GMMK_CMD_KEYCOLORS;
      // buffer[GMMK_KEYCOLORS_COUNT_OFFSET] = ((count - i) * 3 > GMMK_KEYCOLORS_DATA_SIZE)? GMMK_KEYCOLORS_DATA_SIZE : (count - i) * 3;
      const bytesRemaining = (count - i)*3;
      // console.log(`${bytesRemaining} bytes still left to send`)
      const bytesToBeSent = Math.min(GMMK_KEYCOLORS_DATA_SIZE, bytesRemaining);
      const keysToBeSent = bytesToBeSent/3;
      this.buffer[GMMK_KEYCOLORS_COUNT_OFFSET] = bytesToBeSent


      // // *(unsigned short int *)(&(s->buffer[GMMK_KEYCOLORS_START_OFFSET])) = (start * 3) + (i * 3);
      const offset = (start*3) + (i*3);
      this.buffer[GMMK_KEYCOLORS_START_OFFSET] = offset & 0xff;
      this.buffer[GMMK_KEYCOLORS_START_OFFSET + 1] = (offset >> 8) & 0xff;
 

      // Format the data into the buffer to bve sent
      for(let j=0; j<bytesToBeSent; j +=3) {
        // console.log(count, i, i + Math.floor(j/3))
        this.buffer[GMMK_KEYCOLORS_DATA_OFFSET + j + 0] = colors[i + Math.floor(j/3)].r;
        this.buffer[GMMK_KEYCOLORS_DATA_OFFSET + j + 1] = colors[i + Math.floor(j/3)].g;
        this.buffer[GMMK_KEYCOLORS_DATA_OFFSET + j + 2] = colors[i + Math.floor(j/3)].b;
      }

      this._write(this.buffer);
      i+= keysToBeSent;
      // console.log(`${bytesToBeSent} bytes sent -> ${bytesToBeSent/3} keys | ${count - i} remaining`)
    }
    this._endCommand();
  }


  setRate(rate) {
    this._resetBuffer();

    this._startCommand();
    this.buffer[GMMK_COMMAND_OFFSET] = GMMK_CMD_SUBCOMMAND;
    this.buffer[GMMK_SUBCMD_CMD_OFFSET] = 0x01;
    this.buffer[GMMK_SUBCMD_CMD_OFFSET + 1] = 0x0f;
    this.buffer[GMMK_SUBCMD_ARG_OFFSET] = rate;
    this._write(this.buffer)
    this._endCommand();
  }

  // private

  // uses the variant from GMMK util, for now.
  _startCommand() {
    if(!this.device) return;
    this._resetBuffer();
    this.buffer[0] = 0x04;
    this.buffer[GMMK_COMMAND_OFFSET] = GMMK_CMD_START;
    this._write(this.buffer);
  }

  // uses the variant from GMMK util, for now.
  _endCommand() {
    if(!this.device) return;
    this._resetBuffer();
    this.buffer[0] = 0x04;
    this.buffer[GMMK_COMMAND_OFFSET] = GMMK_CMD_END;
    this._write(this.buffer);
  }

  _write(buffer) {
    if(!this.device) return;
    // console.log('____')
    // console.log('Before Checksum')
    // console.log(buffer)
    buffer[0] = 0x04;
    const sum = buffer.slice(GMMK_COMMAND_OFFSET).reduce((sum, e) => sum + e) & 0xffff;
    buffer[GMMK_SUM_OFFSET] = sum & 0xff;
    buffer[GMMK_SUM_OFFSET + 1] = (sum >> 8) & 0xff;
    // console.log('After Checksum')
    // console.log(buffer)
    // console.log('____')
    this.device.write(buffer);
  }
}

export default {
  install: (app) => {
    app.prototype.$gmmkInterface = new GMMKInterface();
  }
}