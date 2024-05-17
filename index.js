import threeJS from './src/three';

new threeJS({
	dom: document.getElementById('container')
});
const button = document.getElementById('omniButton');

const audio = document.getElementById('audiomusic');
const audio2 = document.getElementById('audiomusic2');
button.addEventListener('click',()=>{
	
	audio.volume = 1;
	audio.play();
})



window.onload = function() 
{

	var preloader = document.querySelector('.preloader');
	let clickME = document.querySelector('.btnloading');
	
	clickME.style.display = 'block';
	clickME.addEventListener('click', () => {
		
		
		
		clickME.style.display = 'none';
		preloader.style.opacity = 0;

		
		audio2.loop = true;
		audio2.volume = 0.5;
		audio2.play();
		
		
		
		setTimeout(() => {
			preloader.style.display = 'none';
			},1000)

	});
};