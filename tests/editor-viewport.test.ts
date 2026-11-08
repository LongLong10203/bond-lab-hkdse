import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedCamera, cameraViewBox, DEFAULT_CAMERA, fitCamera } from '../src/lib/editor-viewport';
import { molecule } from '../src/chemistry/molecules';
import { moleculeDisplayBounds } from '../src/lib/molecule-display';

test('mobile cameras keep letters readable at narrow widths with proportional subscripts',()=>{
  for(const width of [280,320,390,600]){
    const size={width,height:320},box=cameraViewBox(DEFAULT_CAMERA,size);
    const scale=width/box.width;
    assert.ok(22*scale>=18,'Main letters are at least 18 CSS pixels');
    assert.ok(13*scale>=10,'Subscripts remain readable');
    assert.ok(Math.abs(width/box.width-size.height/box.height)<1e-9,'No glyph or bond distortion');
  }
});
test('fit includes complete labels for long chains, rings, and charged groups',()=>{
  for(const compound of [{kind:'alkane',n:8},{kind:'alcohol',n:6,cyclic:true},{kind:'ammonium',n:3}] as const){
    const drawing=molecule(compound),bounds=moleculeDisplayBounds(drawing);
    for(const width of [280,390,600]){
      const size={width,height:320},box=cameraViewBox(fitCamera(drawing,size),size);
      assert.ok(box.x<=bounds.left&&box.x+box.width>=bounds.right);
      assert.ok(box.y<=bounds.top&&box.y+box.height>=bounds.bottom);
    }
  }
});
test('panning and zoom change the view without changing drawing coordinates or escaping the canvas',()=>{
  const size={width:320,height:320},drawing=molecule({kind:'alkane',n:4}),before=structuredClone(drawing);
  const panned=boundedCamera({...DEFAULT_CAMERA,x:900,y:-900},size),box=cameraViewBox(panned,size);
  assert.ok(box.x+box.width<=720+.001);
  assert.equal(panned.y,170,'A view taller than the canvas stays vertically centered');
  const zoomed=boundedCamera({...panned,scale:3},size);
  assert.equal(zoomed.scale,1.6);
  fitCamera(drawing,size);
  assert.deepEqual(drawing,before);
});
