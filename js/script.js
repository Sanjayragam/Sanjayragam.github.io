const marquees = Array.from(document.querySelectorAll(".marquee"));

class Marquee {
constructor({ el }) {
  this.el = el;
  this.marqueeAnimation = [
    { transform: "translateX(0)" },
    { transform: `translateX(calc(-100% - var(--gap,0)))` }
  ];

  this.marqueeTiming = {
    duration: this.el.dataset.duration * 20000,
    direction: this.el.dataset.reverse ? "reverse" : "normal",
    iterations: Infinity
  };
  this.animations = [];
  this.SLOWDOWN_RATE = 0.2;
  this.cloneMarqueeGroup();
  this.init();
}

init() {
  for (const m of this.marquee__groups) {
    let q = m.animate(this.marqueeAnimation, this.marqueeTiming);

    this.animations.push(q);
  }

  this.initEvents();
}
slowDownAnimations() {
  for (const a of this.animations) {
    a.playbackRate = this.SLOWDOWN_RATE;
  }
}
resumeAnimationSpeed() {
  for (const a of this.animations) {
    a.playbackRate = true;
  }
}
initEvents() {
  this.el.addEventListener("mouseenter", () => this.slowDownAnimations());
  this.el.addEventListener("mouseleave", () => this.resumeAnimationSpeed());
}

cloneMarqueeGroup() {
  let clone = this.el.querySelector(".marquee__group").cloneNode(true);
  clone.classList.add("clone");
  this.el.appendChild(clone);
  this.marquee__groups = Array.from(
    this.el.querySelectorAll(".marquee__group")
  );
}
}

for (const m of marquees) new Marquee({ el: m });





$(window).on('load', function(){
  setTimeout(removeLoader, 3000); 
});
function removeLoader(){
   $( "#loadingDiv" ).fadeOut(500, function() {
   $( "#loadingDiv" ).remove(); 
  });  
}



