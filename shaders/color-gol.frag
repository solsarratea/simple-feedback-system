uniform sampler2D webcam;
uniform sampler2D backbuffer;
uniform float time;
uniform float resoluton;

varying vec2 texCoordVarying;
uniform vec2 resolution;

const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
precision highp float;

#define M_PI 3.1415926535897932384626433832795

void main() {
  vec2 pixel = gl_FragCoord.xy / resolution;
  vec3 finalColor;
  vec3 webcamCapture = texture2D(webcam, pixel).rgb;
  vec3 lastFrame = texture2D(backbuffer, pixel + vec2(0.00, 0.)).rgb;
  vec3 color = texture2D(backbuffer, pixel).rgb;

  float pixelSize = 4.;
  vec2 pos =
      vec2(floor(gl_FragCoord.x / pixelSize) * pixelSize + pixelSize / 2.0,
           floor(gl_FragCoord.y / pixelSize) * pixelSize + pixelSize / 2.0);
  float threshold = (abs(sin(time * 0.2) * 0.3)) + 0.1;
  float neighbors = 0.0;
  for (float y = -1.0; y <= 1.0; y++) {
    for (float x = -1.0; x <= 1.0; x++) {
      vec4 pixelC = texture2D(
          backbuffer, (pos + vec2(x * pixelSize, y * pixelSize)) / resolution);
      neighbors += step(threshold, pixelC.r);
    }
  };

  float status = step(threshold, color.r);
  neighbors -= status;
  float t = 1.;
  if (status == 1.0 && (neighbors >= 5. || neighbors <= 1.0)) {
    color = webcamCapture.rgb;
  } else if (status == 0.0 && neighbors == 3.0) {
    color = webcamCapture.rgb;
    t = 0.;
  } else
    color = vec3(status);

  vec3 final_color =
      webcamCapture.rgb * (1. - t + 0.9) +
      t * hsv2rgb(color * vec3(sin(lastFrame.r / color.r + time), 0.6, 0.7));
  final_color =
      mix(final_color, lastFrame.rgb, vec3(status) * 1. - webcamCapture);
  gl_FragColor = vec4(mix(final_color, status * lastFrame, 0.2), 1.);
