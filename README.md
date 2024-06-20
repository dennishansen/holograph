# Holograph

Holograph is a visual coding tool built on tldraw.

![Bidirectional temperature converter](https://github.com/dennishansen/propagator-draw/blob/main/public/temp-converter.gif)

## Play with it live
[holograph.so](https://www.holograph.so)

## Run it
```
npm run dev
```

## How it works
Holograph is based on [Propagator Networks](https://dspace.mit.edu/handle/1721.1/54635). Propagators (rectangles) listen to changing input values (circles), run code, and update other values (other circles).

### To use it
- Put your variables in circles
- Put your JavaScript in rectangles (you can write a return or not)
- Connect inputs by drawing arrows from circles to rectangles with text that matches the code's variables
- Connect output by drawing arrows from rectangles to circles.

Download and import the [tutorial](https://github.com/dennishansen/holograph/blob/main/public/tutorial.json) to learn more. Also, click the explore button in the top-right of the site to download examples.

### Fun stuff to try
There's a lot of awesome stuff that can be made with these (maybe everything?).

- A timer!
- A conditional and switch!
- A new simulated universe!
