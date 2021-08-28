//Store top of each li element in array
var sections = $("li")
  .map(function () {
    return $(this).offset().top;
  })
  .get();

//Store all images in array
var images = $("img")
  .map(function () {
    return $(this);
  })
  .get();

//Display first image
images[0].css("display", "block");

//How soon to swap image
var offsetScroll = 300;

//Use this to choose which image will display at each breakpoint
function imageDisplay(j) {
  for (let i = 0; i < images.length; i++) {
    images[i].css("display", "none");
  }
  images[j].css("display", "block");
}

//Image swapping
$(window).scroll(function () {
  var scroll = $(window).scrollTop() + offsetScroll;
  for (let i = 0; i < sections.length; i++) {
    if (scroll > sections[i]) {
      imageDisplay(i);
    }
  }
});

//Function to scroll to specific section
function scrollSection(i) {
  $("html, body").animate(
    {
      scrollTop: sections[i]
    },
    800
  );
}

//Create buttons and previews for all list items
for (let i = 0; i < sections.length; i++) {
  $(".nav-buttons").append(
    '<li><a class="btn" href="#" role="button"></a><div class="preview"></li>'
  );
}
var btns = $(".btn")
  .map(function () {
    return $(this);
  })
  .get();

var thumbs = $(".preview")
  .map(function () {
    return $(this);
  })
  .get();

//Scroll to sections using buttons and add thumbnails to previews
for (let i = 0; i < sections.length; i++) {
  $(btns[i]).click(function () {
    scrollSection(i);
  });
  $(thumbs[i]).css("content", "url(" + images[i].attr("src") + ")");
}