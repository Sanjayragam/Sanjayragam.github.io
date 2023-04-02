
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





