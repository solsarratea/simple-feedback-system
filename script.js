*
 * Sol:
 * https://twitter.com/solquemal
 * https://solquemal.com/
 *
 * We're curiouslyminded:
 * https://www.twitch.tv/curiouslyminded
 * https://www.youtube.com/c/curiouslyminded
 *
 */

let webcamTexture, video;
function initWebcamCapture() {
    video = document.createElement('video');
    video.autoplay="";
    video.style="display:none";
    video.id="feedCam";

    if (navigator.mediaDevices && 
		navigator.mediaDevices.getUserMedia && 
		video) {
        const constraints = { 
			video: { 
				width: 1280, 
				height: 720, 
				facingMode: 'user'
			}
		};

        navigator.mediaDevices
			.getUserMedia(constraints)
			.then((stream) => {
				video.srcObject = stream;
				video.play();
        	})
			.catch((error) => {
            	console.error('Unable to access the camera/webcam.', error);
			});

    } else {
        console.error('MediaDevices interface not available.');
    }
	
    window.video = document.getElementById('video');

    webcamTexture = new THREE.VideoTexture(video);
    webcamTexture.minFilter = THREE.LinearFilter;
    webcamTexture.magFilter = THREE.LinearFilter;
    webcamTexture.needsUpdate= true;
}

let camera, scene, renderer, clock;
function setupMainScene() {
    const container = document.getElementById("shadercollab");

    scene = new THREE.Scene();
    camera = new THREE.Camera();
    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });

    const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    renderer.setPixelRatio(DPR);

    document.body.appendChild(renderer.domElement);
    container.appendChild(renderer.domElement);

    onWindowResize();
    window.addEventListener("resize", onWindowResize);

    clock = new THREE.Clock();
}

let copyScene, diffusionScene, ping, pong, alt;
function setupBufferScenes(){
    copyScene = new THREE.Scene();
    diffusionScene = new THREE.Scene();
	
    const renderTargetParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearMipMapLinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
    };
	
    ping = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParams);
    pong = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParams);
    alt = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParams);
}

let copyMaterial, diffusionMaterial;
function initBufferScenes() {
    copyMaterial = new THREE.ShaderMaterial({
        uniforms : {
            channel0: {
			    type : 't',
			    value : pong.texture
		    },
        },
        vertexShader: document.getElementById( 'vertex' ).innerHTML,
        fragmentShader: document.getElementById( 'copy' ).innerHTML
    });


    const copyObject = new THREE.Mesh( new THREE.PlaneGeometry(2, 2), copyMaterial);
    copyObject.material.side = THREE.DoubleSide;
    copyScene.add(copyObject);

    diffusionMaterial = new THREE.ShaderMaterial({
		uniforms : {
			webcam: { type : 't', value : webcamTexture },
			backbuffer:{ type : 't', value : pong},
			time: {type: "f", value: 0.},
			resolution : { type : 'v2', value : new THREE.Vector2( window.innerWidth, window.innerHeight) }
		},
		vertexShader: document.getElementById( 'vertex' ).innerHTML,
		fragmentShader: document.getElementById( 'diffusion' ).innerHTML
	});

    const diffusionObject = new THREE.Mesh( new THREE.PlaneGeometry(2, 2), diffusionMaterial);
    diffusionObject.material.side = THREE.DoubleSide;
    diffusionScene.add(diffusionObject);

}

let quad;
function initMainScene() {
    const geom = new THREE.PlaneGeometry(2, 2);
    quad = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({map: ping}));
    scene.add(quad);
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* OPTION #1 TO RENDER */
function render_1() {
	diffusionMaterial.uniforms.time.value = clock.getElapsedTime();
	if(renderer.info.render.frame % 1 == 0.) {
		for (var i = 0; i < 1; i++) {

			// Apply Diffusion shader and save output in ping
            renderer.setRenderTarget(ping);
            renderer.render(diffusionScene, camera);
            renderer.setRenderTarget(null);
            renderer.clear();

          	//Swap ping and pong
            let temp = pong;
            pong = ping;
            ping = temp;


		    // Update channels
		    diffusionMaterial.uniforms.backbuffer.value = pong;
        }
        quad.material.map = ping;
	}

	//Render Main Scene
	renderer.render(scene, camera);
}


/* OPTION #2 TO RENDER */
function render_2() {
	diffusionMaterial.uniforms.time.value = clock.getElapsedTime();

	if(renderer.info.render.frame % 1 == 0.) {
		for (var i = 0; i < 2; i++) {
            // Apply Copy shader and save output in alt
            renderer.setRenderTarget(alt);
            renderer.render(copyScene, camera);
            renderer.setRenderTarget(null);
            renderer.clear();

			// Apply Diffusion shader and save output in ping
            renderer.setRenderTarget(ping);
            renderer.render(diffusionScene, camera);
            renderer.setRenderTarget(null);
            renderer.clear();

          	//Swap ping and pong
            let temp = pong;
            pong = ping;
            ping = temp;


		// Update channels
		diffusionMaterial.uniforms.backbuffer.value = alt;
	    copyMaterial.uniforms.channel0.value = pong;
       }
      quad.material.map = ping;
	}
	
	//Render Main Scene
	renderer.render(scene, camera);
}

/* OPTION #3 TO RENDER */
function render_3() {
	diffusionMaterial.uniforms.time.value = clock.getElapsedTime();

	if(renderer.info.render.frame % 2 == 0.) {
		for (var i = 0; i < 2; i++) {

            renderer.setRenderTarget(ping);
            renderer.render(copyScene, camera);
            renderer.setRenderTarget(null);
            renderer.clear();

            renderer.setRenderTarget(pong);
            renderer.render(diffusionScene, camera);
            renderer.setRenderTarget(null);
            renderer.clear();


		    // Update channels
		    diffusionMaterial.uniforms.backbuffer.value = ping;
	        copyMaterial.uniforms.channel0.value = pong;
        }
	}

	//Render Copy Scene
	renderer.render(copyScene, camera);
}


function animate() {
  // render_1();
  // render_2();
   render_3();
  requestAnimationFrame(animate);
}



initWebcamCapture();
setupMainScene();
setupBufferScenes();
initBufferScenes();
initMainScene();
animate();
