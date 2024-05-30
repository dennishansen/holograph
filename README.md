# Holograph

Holograph is a visual coding tool built on top of tldraw.

![Bidirectional temperature converter](https://github.com/dennishansen/propagator-draw/blob/main/public/temp-converter.gif)

## Play with it live
www.holograph.so

## Run it
```
npm run dev
```

## How it works
Holograph is based on [Propagator Networks](https://dspace.mit.edu/handle/1721.1/54635), which enable bi-directional computation via independently operating nodes called Propagators. The propagators (rectangles) listen to changing values (circles), run code, and update other values (other circles).

### To use it
- Put your variables in circles
- Put your JS in rectangles (you can write a return or not)
- Draw arrows from circles to squares with text that matches the variables
- Draw arrows from squares sot the circles to be updated.

### Fun stuff to try
There's a lot of awesome stuff that can be made with these (maybe everything?).

- A timer!
- A conditional and switch!
- A new simulated universe!
