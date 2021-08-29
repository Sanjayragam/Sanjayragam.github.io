
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





