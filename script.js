let webcamTexture, video;
function initWebcamCapture(){
    video = document.createElement('video');
    video.autoplay="";
    video.style="display:none";
    video.id="feedCam";

    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia && video) {
        var constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };


        navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {
            video.srcObject = stream;
            video.play();
        } ).catch( function ( error ) {
            console.error( 'Unable to access the camera/webcam.', error );

        } );

    } else {
        console.error( 'MediaDevices interface not available.' );
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
    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true  });

    const DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
    renderer.setPixelRatio(DPR);

    document.body.appendChild(renderer.domElement);
    container.appendChild(renderer.domElement);

    onWindowResize();
    window.addEventListener("resize", onWindowResize);

    clock = new THREE.Clock();
}

var bufferScene ,ping ,pong, renderTargetParams;
function setupBufferScene(){
    bufferScene = new THREE.Scene();
    renderTargetParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearMipMapLinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
    };

    ping = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, renderTargetParams );
    pong = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, renderTargetParams );

}

var bufferUniforms, bufferMaterial, plane, bufferObject;
function initBufferScene(){
    bufferUniforms =  {
        channel0: { type : 't', value : pong.texture },
    }

    bufferMaterial = new THREE.ShaderMaterial({
        uniforms : bufferUniforms,
        vertexShader: document.getElementById( 'vertex' ).innerHTML,
        fragmentShader: document.getElementById( 'copy' ).innerHTML
    });

    plane = new THREE.PlaneGeometry( 2, 2);  
    bufferObject = new THREE.Mesh( plane, bufferMaterial );
    bufferObject.material.side = THREE.DoubleSide;

    bufferScene.add(bufferObject);
}

var material,quad,geom;
function initMainScene(){
  material = new THREE.ShaderMaterial({
      uniforms : {
          webcam: { type : 't', value : webcamTexture },
          backbuffer:{ type : 't', value : webcamTexture},
          time: {type: "f", value: 0.},
          resolution : { type : 'v2', value : new THREE.Vector2( window.innerWidth, window.innerHeight) }
      },
      vertexShader: document.getElementById( 'vertex' ).innerHTML,
      fragmentShader: document.getElementById( 'frag' ).innerHTML
});
    finalMaterial =  new THREE.MeshBasicMaterial({ map: ping.texture });
    geom = new THREE.PlaneBufferGeometry( 2, 2);
    quad = new THREE.Mesh( geom, material );
    quad.material.side = THREE.DoubleSide;
    scene.add(quad);
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    quad.material.uniforms.time.value = clock.getElapsedTime();
    if(renderer.info.render.frame %4 == 0.){
    // Save current frame to pong
    renderer.setRenderTarget(pong);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();

    // Save buffer current frame to ping
    renderer.setRenderTarget(ping);
    renderer.render(bufferScene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();

    // Save current frame to pong
        renderer.setRenderTarget(pong);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.clear();

        // Save buffer current frame to ping
        renderer.setRenderTarget(ping);
        renderer.render(bufferScene, camera);
        renderer.setRenderTarget(null);
        renderer.clear();

    // Update channels
    quad.material.uniforms.backbuffer.value = ping;
    bufferMaterial.uniforms.channel0.value = pong;

   }
    //Render Main Scene
    renderer.render(scene, camera);
}

function animate() {
    render();
    requestAnimationFrame(animate);
}

initWebcamCapture();
setupMainScene();
setupBufferScene();
initBufferScene();
initMainScene();
animate();
