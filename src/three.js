import * as THREE from 'three';
import GUI from 'lil-gui';
import alienMaterialvertexShader from '../shaders/alienMaterial/vertex.glsl';
import alienMaterialfragmentShader from '../shaders/alienMaterial/fragment.glsl';
import aliens from './alien';

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
			bloomRadius: 1
		};

		this.scene = new THREE.Scene();
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;

		this.camera = new THREE.PerspectiveCamera(18, window.innerWidth / window.innerHeight, 0.01, 1000);
		this.camera.position.set(3, 1.5, 3);
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
		// this.renderer.toneMapping = 4;
		// this.renderer.outputEncoding = THREE.sRGBEncoding
		// this.renderer.toneMapping = THREE.ACESFilmicToneMapping

		this.gltf = new GLTFLoader();
		this.gltf.setDRACOLoader(this.dracoloader);
		this.omnitrix = new GLTFLoader();
		this.omnitrix.setDRACOLoader(this.dracoloader);
		this.omnitrixDial = null;
		this.omnitrixRotation =0;

		this.watchLight = new THREE.PointLight('#d5f5d5', 1, 100);
		this.watchLight.position.y = 0.1;

		this.alienXmodel = null;
		this.isPlaying = true;

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.update();
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.1;

		this.perlinTexture = new THREE.TextureLoader().load('./models/perlin.png');
		this.perlinTexture.wrapS = THREE.RepeatWrapping;
		this.perlinTexture.wrapT = THREE.RepeatWrapping;

		//GUi
		// this.gui = new GUI({ width: '320px' });

		// this.container.appendChild(this.gui.domElement);
		this.materialParameters = {
			color: '#70c1ff'
		};

		this.alienIndex = 0;
		this.alien = aliens[this.alienIndex];

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

		this.settings();
		this.initiPost();
		this.addAliens();
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
				this.omnitrixDial=watch.scene.children[0]
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
			this.changeAliens();
			console.log('changed');
			this.animateSpin();
		});
	}
	changeAliens() {
		// omnitrixDial
		this.rotateDialTimeline = new gsap.timeline();
		this.rotateDialTimeline.to(
			this.omnitrixDial.rotation,
			{
				z: this.omnitrixRotation+1,
				duration: 0.3
			},
			'same'
			);
			
		this.omnitrixRotation +=1;

		this.alienIndex = (this.alienIndex + 1) % aliens.length;
		this.alien = aliens[this.alienIndex];
	}

	async animateSpin() {
		this.timelineToRemove = new gsap.timeline();

		await this.timelineToRemove.to(
			this.alienXmodel.scale,
			{
				x: 0,
				y: 0,
				z: 0,
				duration: 0.3
			},
			'same'
		);
		this.removeAlien();
	}

	removeAlien() {
		this.scene.remove(this.alienXmodel);
		this.addAliens();
	}

	addAliens() {
		this.gltf.load(
			`./models/${this.alien}`,
			(alienX) => {
				this.alienXmodel = alienX.scene;
				this.scene.add(alienX.scene);
				alienX.scene.scale.set(0, 0, 0);
				alienX.scene.position.set(0, -0.2, 0);
				alienX.scene.rotation.y = Math.PI/8

				alienX.scene.children.forEach((parts) => {
					parts.material = this.material;
				});
				this.scaleAliens();
			},
			undefined,
			(err) => {
				console.log(err);
			}
		);
	}
	scaleAliens() {
		this.timelineToRemove = new gsap.timeline();
		this.timelineToRemove.to(
			this.alienXmodel.scale,
			{
				x: 0.15,
				y: 0.15,
				z: 0.15,
				duration: 0.25
			},
			'same'
		);
	}

	settings() {
		let that = this;
		this.settings = {
			exposure: 5,
			bloomThreshold: 0.1,
			bloomStrength: 0.5,
			bloomRadius: 0.1
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

		if (this.alienXmodel) this.alienXmodel.rotation.y += 0.002;

		// console.log(this.camera.position)
		//for Bloom Enable this
		this.composer.render(this.scene, this.camera);
	}
}
