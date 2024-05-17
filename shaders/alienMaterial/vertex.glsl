export default /* glsl */`
uniform float uTime;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vDisplacement;
#define PI 3.14

float random2D(vec2 value)
{
    return fract(sin(dot(value.xy, vec2(12.9898,78.233))) * 43758.5453123);
}



void main() {


	vec4 modelPosition = modelMatrix * vec4(position,1.0);


	//glitch
	float glitchStrength = sin(uTime *5.0 - modelPosition.y * 10.);
	glitchStrength = smoothstep(0.4,1.0,glitchStrength);
	glitchStrength *= 0.02; 
	modelPosition.x+= (random2D(modelPosition.xz  + uTime)- 0.5) * glitchStrength;
	modelPosition.z+= (random2D(modelPosition.zx  + uTime)- 0.5) * glitchStrength;


	gl_Position = projectionMatrix * viewMatrix * modelPosition;


	vec4 modelNormal = modelMatrix *vec4(normal,0.0);

	vPosition = modelPosition.xyz;
	vNormal = modelNormal.xyz;
}
`;
