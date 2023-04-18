
$(window).on('load', function(){
  setTimeout(removeLoader, 3000); 
});
function removeLoader(){
   $( "#loadingDiv" ).fadeOut(500, function() {
   $( "#loadingDiv" ).remove(); 
  });  
}

$(document).ready(function(){
  var mouseX, mouseY;
  var ww = $( window ).width();
  var wh = $( window ).height();
  var traX, traY;
  
  $(document).mousemove(function(e){
    mouseX = e.pageX;
    mouseY = e.pageY;
    traX = ((4 * mouseX) / 570) + 40;
    traY = ((4 * mouseY) / 570) + 50;
    $(".title").css({"background-position": traX + "%" + traY + "%"});
  });
  
  $("#menu").click(function(e){
    $(this).toggleClass("active")
    $("#header").toggleClass("active")
  })
});








//light and dark mode switching
$(function() {
  $('#toggleDayOrNight').click(function(e) {
      // toggle classes

      $('.profileimagedivdark').toggleClass('profileimagedivdark-dark-mode')
      $('.profileimagediv').toggleClass('profileimagediv-dark-mode')
      $('.cursortext').toggleClass('cursortext-dark-mode')
      $('.cursor').toggleClass('cursor-dark-mode')
      $('.expertimagediv').toggleClass('expertimagediv-dark-mode')
      $('.expertimagedivdark').toggleClass('expertimagedivdark-dark-mode')
      $('.footerdiv').toggleClass('footerdiv-dark-mode')
      $('#mail').toggleClass('mail-dark-mode')
      $('#art').toggleClass('art-dark-mode')

      $('#containers').toggleClass('containers-dark-mode ')
      $('.body').toggleClass('body-dark-mode')
      $('.logo').toggleClass('logo-dark')
      $('.logomob').toggleClass('logo-dark')
      $('.content').toggleClass('content-dark-mode')
      $('.btn').toggleClass('btn-dark-mode')
      $('.intro').toggleClass('intro-dark-mode')
      $('.checkout').toggleClass('checkout-dark-mode')
      $('.aboutt').toggleClass('aboutt-dark-mode')
      $('.aboutme').toggleClass('aboutme-dark-mode')
      
      
      // set background-image when clicked
      if($('#containers')[0].className) {
      $('#toggleDayOrNight').css({'background-image':'url(images/sun.svg)'})
      } else {
      $('#toggleDayOrNight').css({'background-image':'url(images/moon.svg)'})
      }
  })
})







const marquees = Array.from(document.querySelectorAll(".marquee"));

class Marquee {
constructor({ el }) {
  this.el = el;
  this.marqueeAnimation = [
    { transform: "translateX(0)" },
    { transform: `translateX(calc(-100% - var(--gap,0)))` }
  ];

  this.marqueeTiming = {
    duration: this.el.dataset.duration * 10000,
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








const cursorRounded = document.querySelector('.cursor');
const cursorText = document.querySelector('.custom');

document.addEventListener('mousemove', e => {
  const mouseX = e.pageX;
  const mouseY = e.pageY;   
  
  cursorRounded.style.top = mouseY + "px"; 
  cursorRounded.style.left = mouseX + "px";   
  cursorText.style.top = mouseY + "px"; 
  cursorText.style.left = mouseX + "px"; 
})











