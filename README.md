# Propagator Draw

This is a propagator network simulator on top of tldraw. 
Play with it live here https://holograph-1.vercel.app/

![Bidirectional temperature converter](https://github.com/dennishansen/propagator-draw/blob/main/public/temp-converter.gif)

### To run
```
npm run dev
```

Propagator networks enable bi-directional computation via independently operating nodes. Propagators (rectangles) listen to changing inputs (circles), run code, and update connected outputs (circles).
You can make your own here.
- Put your variables in circles
- Put your JS in rectangles (you can write a return or not)
- Draw arrows from circles to squares with text that matches the variables
- Draw arrows from squares sot the circles to be updated.
There's lot of awesome stuff that can be made with these (maybe everything?).

Fun stuff to try and make:
- A timer!
- A conditional and switch
- A new simulated universe
