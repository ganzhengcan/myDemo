import * as THREE from '../js/three/build/three.module.js';
import { OrbitControls } from '../js/three/examples/jsm/controls/OrbitControls.js';
import THREEx from "../geometricglow/threex.js";
import {data, lineSphereData} from './data.js';

class Dome {
  constructor() {
    window.addEventListener('resize', this.windowResize.bind(this));
    this.scene = new THREE.Scene();
    this.fontLoader = new THREE.FontLoader();
    this.scene.fog = new THREE.Fog(0x333, 0, 3000);
    this.d = 0;
  }
  init() {
    this.initRenderer();
    this.initCamera();
    this.initStats();
    this.setLight();
    this.initOrbitControls();
    this.initGroup();
    this.loadSphereTexture();
    this.lineAndShpere();
    this.setOutSphere();
    this.initGlowMesh();
    this.animate();
  }
  loadSphereTexture() {
    this.textureLoader = new THREE.TextureLoader();
    this.sphereTexture = this.textureLoader.load('./images/texture3.png');
  }
  loadFont() {
    const microsoftFont = new Promise(resolve => {
      this.fontLoader.load('./fonts/Microsoft YaHei_Regular.json', font => {
        resolve(font)
      });
    });
    const uusFont = new Promise(resolve => {
      this.fontLoader.load('./fonts/UUS UN ELEKTRON_Regular.json', font => {
        resolve(font)
      });
    })
    return new Promise(resolve => {
      Promise.all([microsoftFont, uusFont]).then(res => {
        resolve(res);
      })
    })
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 1, 2000);
    this.camera.position.z = 900;
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);
  }
  initStats() {
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = 0;
    this.stats.domElement.style.left = 0;
    document.body.appendChild(this.stats.domElement);
  }
  initOrbitControls() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.minDistance = 1;
    this.orbitControls.maxDistance = 20000;
  }
  setLight() {
    const light = new THREE.HemisphereLight(0xffffff, 1);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    light.position.set(0, 1, 0);
    this.scene.add(light);
    this.scene.add(ambientLight);
  }
  animate() {
    this.render();
    requestAnimationFrame(this.animate.bind(this));
  }
  initGroup() {
    this.sphereLineGroup = new THREE.Group();
    this.scene.add(this.sphereLineGroup);
  }
  setCenterSpherePosition(index) {
    let x = 0;
    let y = 0;
    let z = 0;
    const spereRadius = 50;
    if(index !== 0) {
      x = (spereRadius * 2) * Math.sin(index * Math.PI / 3);
      y = (spereRadius * 2) * Math.cos(index * Math.PI / 3);
    }
    return { x, y, z }
  }
  setInnerSphereGlowMesh(sphereMesh) {
    const geometry	= sphereMesh.geometry.clone();
    THREEx.dilateGeometry(geometry, 3);
    const material	= THREEx.createAtmosphereMaterial();

    material.uniforms.glowColor.value	= sphereMesh.material.color;
    material.uniforms.coeficient.value = 1.1;
    material.uniforms.power.value	= 2;
    const meshHalo	= new THREE.Mesh(geometry, material );

    return meshHalo;
  }
  setShpereAndTextGroup(item, color) {
    const material = new THREE.MeshPhongMaterial({
      alphaMap: this.sphereTexture,
      color: color || 0x2F91FF,
      side: THREE.DoubleSide,
      alphaTest: 0.7
    });
    const fontSetting = {
      size: 16,
      height: 0
    }
    // 球
    const sphereGeometry = new THREE.SphereGeometry(50, 30, 30);
    const sphereMesh = new THREE.Mesh(sphereGeometry, material);
    sphereMesh.rotation.y = Math.PI / 2;
    const glowSphere = this.setInnerSphereGlowMesh(sphereMesh)

    // 文字部分
    const textMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
    let valueTextColor = 0x15F152;
    if (item.value < 90 && item.value >= 80) {
      valueTextColor = 0xFFCB4D
    } else if (item.value < 80) (
      valueTextColor = 0xFF2A44
    )
    const valueTextMaterial = new THREE.MeshPhongMaterial({color: valueTextColor});
    const nameTextGeometry = new THREE.TextGeometry(item.name, {
      ...fontSetting,
      font: this.fonts[0]
    });
    const valueTextGeometry = new THREE.TextGeometry(item.value.toString(), {
      ...fontSetting,
      size: 20,
      font: this.fonts[1]
    });
    const nameMesh = new THREE.Mesh(nameTextGeometry, textMaterial);
    const valueMesh = new THREE.Mesh(valueTextGeometry, valueTextMaterial);

    // 设置文字居中
    new THREE.BoxHelper(nameMesh);
    new THREE.BoxHelper(valueMesh);
    // console.log(nameMesh)
    const nameMax = nameMesh.geometry.boundingBox.max;
    const valueMax = valueMesh.geometry.boundingBox.max;
    nameMesh.position.x = - nameMax.x / 2;
    nameMesh.position.y = nameMax.y - 25;
    nameMesh.position.z = valueMesh.position.z = 50;
    valueMesh.position.x = - valueMax.x / 2;
    valueMesh.position.y = - valueMax.y - 15;

    // 小球的组
    const shpereGroup = new THREE.Group();
    shpereGroup.add(sphereMesh);
    shpereGroup.add(nameMesh);
    shpereGroup.add(valueMesh);
    shpereGroup.add(glowSphere);

    return shpereGroup
  }
  centerSphere() {
    const group = new THREE.Group();
    
    data.forEach((item, index) => {
      const shpereGroup = this.setShpereAndTextGroup(item, 0x2F91FF)
      
      // 小球的组位置
      const { x, y , z } = this.setCenterSpherePosition(index);
      shpereGroup.position.x = x;
      shpereGroup.position.y = y;
      shpereGroup.position.z = z;

      group.add(shpereGroup);
    })
    this.scene.add(group)
  }
  setRotateSpheres(data) {
    const group = new THREE.Group();
    data.forEach(item => {
      const shpereGroup = this.setShpereAndTextGroup(item, 0x21CEFF);
      group.add(shpereGroup);
    })
    return group;
  }
  async lineAndShpere() {
    this.fonts = await this.loadFont();
    const len = lineSphereData.length;
    lineSphereData.forEach((item, index) => {
      const group = new THREE.Group();
      const spheres = this.setRotateSpheres(item);
      const line = this.setLine(len, index);
      group.add(spheres, line);
      this.sphereLineGroup.add(group);
    })
    this.centerSphere();
  }
  setSpherePosition(d) {
    const {children} = this.sphereLineGroup;
    const len = children.length;
    for(let i = 0; i < len; i++) {
      d += i / len || 0;
      d = d > 1 ? d - 1 : d;
      const sphereLine = children[i].children;
      const sphereGroup = sphereLine[0].children;
      const lineVertices = sphereLine[1].comMatrixWorld;
      const lineVerticesLen = lineVertices.length - 1;
      const d2 = d > 0.5 ? d - .5 : d + .5;
      const postion1 = lineVertices[Math.floor(lineVerticesLen * d)];
      const postion2 = lineVertices[Math.floor(lineVerticesLen * d2)];
      sphereGroup[0].position.copy(postion1);
      sphereGroup[1].position.copy(postion2);
    }
  }
  setLine(total, i) {
    const segments = 1000;
    const r = 400;
    const angle = 2 * Math.PI / segments;
    const ringGeometry = new THREE.Geometry();
    const vertices = [];
    for(let j = 0; j < segments; j++) {
      const curAngle = angle * j;
      const x = r * Math.cos(curAngle);
      const y = r * Math.sin(curAngle);
      vertices.push(new THREE.Vector3( x,  y, 0 ));
    }
    ringGeometry.vertices = vertices;
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x21CEFF,
      linewidth: 2,
    })
    const ringMesh = new THREE.LineLoop(ringGeometry, ringMaterial);
    const rotateZ = Math.PI / 4;
    const rotateX = - Math.PI / 3 + Math.random() * .2 - .1;
    const rotateY = 2 * Math.PI / total * i;
    ringMesh.rotateZ(rotateZ);
    ringMesh.rotateX(rotateX);
    ringMesh.rotateY(rotateY);
    ringMesh.updateMatrixWorld();
    const comMatrixWorld = []
    for(let j = 0; j < segments; j++) {
      const vector = ringMesh.geometry.vertices[j].clone();
      vector.applyMatrix4( ringMesh.matrixWorld );
      comMatrixWorld.push(vector);
    }
    ringMesh.comMatrixWorld = comMatrixWorld;
    return ringMesh;
  }
  initGlowMesh() {
    const geometry	= this.outSphere.geometry.clone();
    THREEx.dilateGeometry(geometry,10);
    const material	= THREEx.createAtmosphereMaterial();
    const meshHalo	= new THREE.Mesh(geometry, material );	
    this.scene.add( meshHalo );

    material.uniforms.glowColor.value	= new THREE.Color(0x2F91FF);
    material.uniforms.coeficient.value = 1;
    material.uniforms.power.value	= 2.3;

    var datGUI	= new dat.GUI();
    new THREEx.addAtmosphereMaterial2DatGui(material, datGUI);
    // var glowMesh	= new THREEx.GeometricGlowMesh(this.outSphere)
    // this.outSphere.add(glowMesh.object3d)
    // var insideUniforms	= glowMesh.insideMesh.material.uniforms
    // insideUniforms.glowColor.value = new THREE.Color(0x2F91FF)
    // var outsideUniforms	= glowMesh.outsideMesh.material.uniforms
    // outsideUniforms.glowColor.value = new THREE.Color(0x2F91FF)
    // var datGUI	= new dat.GUI()
    // new THREEx.addAtmosphereMaterial2DatGui(glowMesh.insideMesh.material, datGUI)	
    // new THREEx.addAtmosphereMaterial2DatGui(glowMesh.outsideMesh.material, datGUI)	
    
  }
  setOutSphere() {
    const texture = this.textureLoader.load('./images/蜂窝循环-白.png')
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.x = texture.repeat.y = 2;
    const geometry = new THREE.SphereGeometry(500, 50, 50);
    const material = new THREE.MeshLambertMaterial({
      alphaMap: texture,
      color: 0x2F91FF,
      transparent: true,
      // skinning: true,
      opacity: .1
    });
    this.outSphere = new THREE.Mesh(geometry, material);
    // const distanceMaterial = new THREE.MeshDistanceMaterial({
    //   alphaMap: material.alphaMap,
    //   alphaTest: material.alphaTest
    // });
    // this.outSphere.customDistanceMaterial = distanceMaterial;
    this.scene.add(this.outSphere);
  }
  
  render() {
    this.setSpherePosition(this.d)
    this.d += 0.001;
    if (this.d > 1) {
      this.d = 0
    }
    if(this.outSphere) {
      this.outSphere.rotation.y += 0.001;
    }
    this.stats.update();
    this.renderer.render(this.scene, this.camera);
  }
  windowResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
}

const dome = new Dome();
dome.init();