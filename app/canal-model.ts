import * as T from "three";
import type { SceneState } from "./anatomy";
import { decodeModelResponse } from "./model-download";
interface Section { y: number; count: number; outer: number[][][]; canals: number[][][] }
interface Manifest {
 bytes: number; url: string; gzip: string;
 meshes: { id: string; positions: number; indices: number; vertexCount: number; indexCount: number }[];
 models: { type: string; stages: number[]; sections: Section[] }[];
}
export const CANAL_MODEL_BOUNDS = [[-.006,.237,-.005],[.006,.263,.005]] as const;
/** Separate teaching geometry inside the existing renderer. No atlas tooth is modified. */
export async function loadCanalModel(signal: AbortSignal) {
 const response=await fetch('/canal-types/atlas.json',{signal});
 if(!response.ok)throw Error('三维根管分型目录加载失败');
 const manifest=await response.json() as Manifest;
 const buffer=await decodeModelResponse(await fetch(manifest.gzip,{signal}),manifest.bytes,true);
 const group=new T.Group();group.position.y=.25;group.visible=false;
 const shellMaterial=new T.MeshStandardMaterial({color:'#e9dfc8',transparent:true,opacity:.19,roughness:.36,depthWrite:false,side:T.DoubleSide});
 const pulpMaterial=new T.MeshStandardMaterial({color:'#b94754',roughness:.38,metalness:.02,side:T.DoubleSide});
 const meshes=new Map<string,T.Mesh>();
 for(const part of manifest.meshes){
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,part.positions,part.vertexCount*3),3));
  geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer,part.indices,part.indexCount),1));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const mesh=new T.Mesh(geometry,part.id==='shell'?shellMaterial:pulpMaterial);
  mesh.visible=false;mesh.renderOrder=part.id==='shell'?6:4;meshes.set(part.id,mesh);group.add(mesh);
 }
 const capMaterial=new T.MeshBasicMaterial({color:'#e2cfa8',side:T.DoubleSide});
 const canalCapMaterial=new T.MeshBasicMaterial({color:'#a93548',side:T.DoubleSide});
 const caps=new T.Group();group.add(caps);
 const cutaway=new T.Plane(new T.Vector3(0,0,-1),0);
 const sectionPlane=new T.Plane(new T.Vector3(0,-1,0),.25);
 let lastSection='';
 const clearCaps=()=>{for(const child of [...caps.children]){(child as T.Mesh).geometry.dispose();caps.remove(child);}};
 const vectors=(loop:number[][])=>loop.map(([x,z])=>new T.Vector2(x/1000,z/1000));
 const addCap=(shape:T.Shape,material:T.Material,y:number)=>{
  const mesh=new T.Mesh(new T.ShapeGeometry(shape),material);mesh.rotation.x=Math.PI/2;mesh.position.y=y-.000005;mesh.renderOrder=7;caps.add(mesh);
 };
 return {group,
  update(state:SceneState,globalPlane:T.Plane){
   group.visible=!!state.canalMode;if(!group.visible)return;
   const model=manifest.models[state.canalType??0]??manifest.models[0];
   const section=model.sections[state.canalSection??-1];const style=state.canalShell??'transparent';
   meshes.forEach((mesh,id)=>{mesh.visible=id===model.type||(id==='shell'&&style!=='hidden');});
   const planes=state.clipping?.enabled?[globalPlane]:[];
   if(section){sectionPlane.constant=.25+section.y;planes.push(sectionPlane);}
   pulpMaterial.clippingPlanes=planes;
   shellMaterial.clippingPlanes=!section&&style==='cutaway'?[...planes,cutaway]:planes;
   shellMaterial.opacity=style==='cutaway'?.48:state.canalShellOpacity??.19;
   capMaterial.clippingPlanes=canalCapMaterial.clippingPlanes=state.clipping?.enabled?[globalPlane]:[];
   const key=`${model.type}:${state.canalSection}:${style}`;
   if(key!==lastSection){lastSection=key;clearCaps();if(section){
    if(style!=='hidden')for(const loop of section.outer){const shape=new T.Shape(vectors(loop));shape.holes=section.canals.map(hole=>new T.Path(vectors(hole)));addCap(shape,capMaterial,section.y);}
    for(const loop of section.canals)addCap(new T.Shape(vectors(loop)),canalCapMaterial,section.y);
   }}
  },
  dispose(){clearCaps();meshes.forEach(mesh=>mesh.geometry.dispose());shellMaterial.dispose();pulpMaterial.dispose();capMaterial.dispose();canalCapMaterial.dispose();group.removeFromParent();}
 };
}
export type CanalModel=Awaited<ReturnType<typeof loadCanalModel>>;
