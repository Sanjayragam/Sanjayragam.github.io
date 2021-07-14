const menuBtn = document.querySelector(".menu-btn")
backBtn = document.querySelector(".back-btn")
menu = document.querySelector("nav");

menuBtn.addEventListener("click",() =>{
menu.style.transform = "translatex(0)";
});

backBtn.addEventListener("click",() =>{
menu.style.transform = "translatex(-100%)";
});
