export default /* glsl */`
uniform float uTime;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vDisplacement;


void main() 
{
     vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing)
          normal *= - 1.0;


    // Stripes
    float stripes = mod((vPosition.y - uTime * 0.05) * 30.0, 1.0);
    stripes = pow(stripes, 6.0);

    // Fresnel
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 3.0);

    //falloff
    float falloff = smoothstep(0.8,0.0,fresnel);

    //hologram
    float holographic = stripes * fresnel;
    holographic += fresnel * 1.25;
    holographic *=falloff;
    

    // Final color
    gl_FragColor = vec4(0.0,1.0,0.0, holographic);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>

}
`;
