const reveals=document.querySelectorAll(".reveal");
window.addEventListener("scroll",()=>{
  reveals.forEach(el=>{
    if(el.getBoundingClientRect().top < window.innerHeight-100){
      el.classList.add("active");
    }
  });
});
const slider = document.querySelector('#slider');
new bootstrap.Carousel(slider, {
  interval: 4000,   // 4 seconds
  pause: 'hover',
  ride: 'carousel'
});
function togglePassword(){
  const pass = document.getElementById("password");
  pass.type = pass.type === "password" ? "text" : "password";
}
