
# GMMK Ambilight
A currently experimental application to stream you full display content to a GMMK keyboard.
![Showcase](https://raw.githubusercontent.com/meinlebenswerk/GMMKAmbilight/master/preview/Streaming.png?raw=true)

## Usage
As there are no builds available (yet), you need to run the app from sources.
For the following steps, you need to have `nodejs, git` and probably `node-gyp` installed and properly configured.
To do that, first clone this repository with

    git clone https://github.com/meinlebenswerk/GMMKAmbilight.git
    cd GMMKAmbilight
   
After that, install all the depencies with:

    npm i
and run the application: 
   

     npm run electron:serve


## Internals
For those who are interested:
The whole thing is a VueJS and electron application.
Chrome/Electron's `desktopCapturer` is used to grab your screen, this is then put into a HTML-Video element - while this could be used directly to read pixels, a further glsl shader is used to gaussian blur ontop of the image.
The blur is currently implemented as a simple, gaussian curve, computed on the JS-Side and then transferred over to the shader.


## Issues

 - the UI get's slowed down by the synchronous USB-Transfers
 - currently, only ISO-Keyboard layouts are supported :)
 - The app is a bit clunky to use.
 - ~~Blur filter is not configurable anymore~~
  
## Big thanks to:
Most of the control code is ~~stolen~~ inspired by these projects:

 - [dokutan](https://github.com/dokutan)'s [rgb_keyboard](https://github.com/dokutan/rgb_keyboard)
 - [paulguy](https://github.com/paulguy)'s [gmmkctl](https://github.com/paulguy/gmmkctl)
 - [Kolossi](https://github.com/Kolossi)'s [GMMKUtil](https://github.com/Kolossi/GmmkUtil)

Big thanks to paulguy! - Only with the help of gmmkctl and your awesome key-maps, was I able to get the mapping and control to work!
Internally, [Andreas Tare](https://github.com/andresteare)'s keymap for his hand-built `handwired/oem_iso_fullsize` keyboard, is used to map the GMMK's keys to exact pixel positions (This is not entirely necessary, but hey it's kinda cool).

And probably some repos and amazing people I forgot about (sorry, will add you as soon as I remember!).
