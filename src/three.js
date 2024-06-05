import * as THREE from 'three';
import GUI from 'lil-gui';
import alienMaterialvertexShader from '../shaders/alienMaterial/vertex.glsl';
import alienMaterialfragmentShader from '../shaders/alienMaterial/fragment.glsl';
// import aliens from './alien';
import Omnitrixaliens from './alien';

import Stats from 'stats.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';



export default class threeJS {
	constructor(options) {
		this.gsap = gsap.registerPlugin(ScrollTrigger);
		this.previousTime = 0;
		this.time = 0;
		this.container = options.dom;

		this.stats1 = new Stats();
		this.container.appendChild(this.stats1.dom);
		this.stats1.showPanel(1);
		this.debugObject = {
			depthColor: '#a30000',
			surfaceColor: '#ffe770'
		};
		this.params = {
			exposure: 10.5,
			bloomStrength: 10.5,
			bloomThreshold: 10.1,
			bloomRadius: 1.5
		};

		this.scene = new THREE.Scene();
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.01, 1000);
		this.camera.position.set(3, 1.2, 3);
		// this.camera.position.set(7,7,7);
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		this.renderer.setSize(this.width, this.height);
		this.container.appendChild(this.renderer.domElement);

		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		this.clock = new THREE.Clock();

		this.dracoloader = new DRACOLoader();
		this.dracoloader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');


		this.gltf = new GLTFLoader();
		this.gltf.setDRACOLoader(this.dracoloader);
		this.omnitrix = new GLTFLoader();
		this.omnitrix.setDRACOLoader(this.dracoloader);
		this.omnitrixDial = null;
		this.omnitrixRotation = 0;



		this.watchLight = new THREE.PointLight('#d5f5d5', 1, 100);
		this.watchLight.position.y = 0.1;

		this.alienXmodel = null;
		this.isPlaying = true;

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.update();
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.enablePan = false
		this.controls.minAzimuthAngle = -Math.PI / 4
		this.controls.maxAzimuthAngle = Math.PI / 1.35
		this.controls.minPolarAngle = Math.PI / 4
		this.controls.maxPolarAngle = Math.PI / 2

		this.perlinTexture = new THREE.TextureLoader().load('./models/perlin.png');
		this.perlinTexture.wrapS = THREE.RepeatWrapping;
		this.perlinTexture.wrapT = THREE.RepeatWrapping;

		this.materialParameters = {
			color: '#70c1ff'
		};


		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uTime: new THREE.Uniform(0)
			},
			// wireframe:true,
			vertexShader: alienMaterialvertexShader,
			fragmentShader: alienMaterialfragmentShader,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending
		});



		//aliens
		this.initAlien = true;
		this.alienArray = [];
		this.alienIndex = 0;
		this.rath = null;
		this.cannonboltNew = null;
		this.BrainStorm = null;
		this.Amphibian = null;
		this.GreyMatter = null;
		this.DiamondHead = null;
		this.BigChill = null;


		this.settings();
		this.initiPost();
		this.loadAliens();

		this.render();
		this.resize();
		this.setupResize();
		this.addWatch();
	}
	addWatch() {
		this.omnitrix.load(
			'./models/omnitrix2.glb',
			(watch) => {
				watch.scene.scale.set(0.2, 0.2, 0.2);
				this.omnitrixDial = watch.scene.children[0]
				watch.scene.position.y = -0.7;
				watch.scene.rotation.y = -Math.PI / 4;
				this.scene.add(watch.scene);
			},
			undefined,
			(error) => {
				console.log(error);
			}
		);

		this.scene.add(this.watchLight);

		this.button = document.getElementById('omniButton');
		this.button.addEventListener('click', () => {
			if (this.initAlien) this.deleteInitAlien()

			this.changeAliens();

		});
	}

	deleteInitAlien() {
		this.initAlien = false
		this.scene.remove(this.scene.children[2])
	}
	async changeAliens() {
		// omnitrixDial
		this.rotateDialTimeline = new gsap.timeline();
		this.rotateDialTimeline.to(
			this.omnitrixDial.rotation,
			{
				z: this.omnitrixRotation + 1,
				duration: 0.3
			},
			'same'
		);
		this.omnitrixRotation += 1;




		this.timelineToRemove = new gsap.timeline();
		await this.timelineToRemove.to(
			this.alienArray[this.alienIndex].scale,
			{
				x: 0,
				y: 0,
				z: 0,
				duration: 0.3
			},

		).then(() => {

			this.scene.remove(this.alienArray[this.alienIndex])
			this.alienIndex = (this.alienIndex + 1) % (this.alienArray.length)
			this.scene.add(this.alienArray[this.alienIndex])
		}).then(() => {

			this.timelineToRemove.to(
				this.alienArray[this.alienIndex].scale,
				{
					x: 0.15,
					y: 0.15,
					z: 0.15,
					duration: 0.3
				},
			)
		})


	}




	addAliens(alienNumber) {
		return new Promise((resolve, reject) => {
			this.gltf.load(
				`${Omnitrixaliens[alienNumber]}`,
				(alienX) => {

					alienX.scene.scale.set(0, 0, 0);

					if (this.initAlien) {
						alienX.scene.scale.set(0.15, 0.15, 0.15);
						this.initAlien = false
					}


					alienX.scene.position.set(0, -0.2, 0);
					alienX.scene.rotation.y = Math.PI / 8;

					alienX.scene.children.forEach((parts) => {
						parts.material = this.material;
					});
					this.alienXmodel = alienX.scene;

					resolve(alienX.scene); // Resolve the promise with alienX.scene
				},
				undefined,
				(err) => {
					console.log(err);
					reject(err); // Reject the promise if there's an error
				}
			);
		});
	}
	async loadAliens() {
		this.rath = this.addAliens(0);
		this.cannonboltNew = this.addAliens(1);
		this.BrainStorm = this.addAliens(2);
		this.Amphibian = this.addAliens(3);
		this.GreyMatter = this.addAliens(4);
		this.DiamondHead = this.addAliens(5);
		this.BigChill = this.addAliens(6);

		await Promise.all([
			this.rath.then(data => this.alienArray.push(data)),
			this.cannonboltNew.then(data => this.alienArray.push(data)),
			this.BrainStorm.then(data => this.alienArray.push(data)),
			this.Amphibian.then(data => this.alienArray.push(data)),
			this.GreyMatter.then(data => this.alienArray.push(data)),
			this.DiamondHead.then(data => this.alienArray.push(data)),
			this.BigChill.then(data => this.alienArray.push(data))
		]);

		this.scene.add(this.alienArray[this.alienIndex])
		let clickME = document.querySelector('.btnloading');
		clickME.style.display = 'block';

	}


	settings() {
		let that = this;
		this.settings = {
			exposure: 0,
			bloomThreshold: 0.1,
			bloomStrength: 1.2,
			bloomRadius: 1.3
		};
	}

	setupResize() {
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		window.addEventListener('resize', this.resize.bind(this));
	}
	initiPost() {
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, this.settings);

		this.renderScene = new RenderPass(this.scene, this.camera);
		this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
		this.bloomPass.threshold = this.settings.bloomThreshold;
		this.bloomPass.strength = this.settings.bloomStrength;
		this.bloomPass.radius = this.settings.bloomRadius;

		this.composer = new EffectComposer(this.renderer, this.renderTarget);
		this.composer.addPass(this.renderScene);
		this.composer.addPass(this.bloomPass);
	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer.setSize(this.width, this.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.composer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}
	stop() {
		this.isPlaying = false;
	}
	play() {
		if (!this.isPlaying) {
			this.render();
			this.isPlaying = true;
		}
	}

	render() {
		this.elapsedTime = this.clock.getElapsedTime();
		this.deltaTime = this.elapsedTime - this.previousTime;
		this.previousTime = this.elapsedTime;

		requestAnimationFrame(this.render.bind(this));

		this.renderer.render(this.scene, this.camera);
		this.renderer.clearDepth();

		if (!this.isPlaying) return;
		this.controls.update();

		this.stats1.update();

		this.material.uniforms.uTime.value += this.deltaTime;


		if (this.scene.children[2]?.children[0].name) {

			//solving cannonBold rotation problem
			if (this.scene.children[2]?.children[0].name == "Plane_Black_0") {
				this.scene.children[2].children[0].rotation.z += 0.009;
			}
			else if(this.scene.children[2]?.children[0].name) {
				this.scene.children[2].children[0].rotation.y += 0.009;
			}
		}




		//for Bloom Enable this
		this.composer.render(this.scene, this.camera);
	}
}
