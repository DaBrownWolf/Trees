// Lab4
// Vertex shader program
var VSHADER_SOURCE =
	'attribute vec3 a_Position;\n' +
	'attribute vec3 a_Normal;\n' +
	'attribute vec4 a_Color;\n' +
	'uniform mat4 u_NormalMat, u_Projection, u_ModelView;\n' +
	'uniform vec3 u_MouseVec;\n' +
	'uniform vec4 u_Translation;\n' +
	'uniform mat4 u_Scale;\n' +
	'uniform vec4 u_idColor;\n' +
	'uniform mat4 u_RotationX, u_RotationZ;\n' +  
	'varying vec3 v_NormalInterp;\n' +
	'varying vec3 v_VertPos;\n' +
	'varying float v_Cosa, v_Sina;\n' +
	'varying float v_Cosr, v_Sinr;\n' +
	'uniform int u_Mode;   // Rendering mode\n' +
	'uniform bool u_PickedTree;\n' +
	'uniform float u_Id;\n' +
	'uniform vec4 u_Kd;   // Diffuse reflection coefficient\n' +
	'uniform vec3 u_Ks;   // Specular reflection coefficient\n' +
	'uniform float u_ShininessVal;\n' +
	'varying float v_Id;		// ID for the tree\n' +
	'// Material color\n' +
	'uniform vec4 u_Color;\n' +
	'uniform vec3 u_LightColor;\n' +
	'uniform vec3 u_LightDirection; // Light direction;\n' +
	'uniform vec3 u_SpherePosition; // Light direction for the sphere;\n' +
	'uniform bool u_SphereOn;\n' +
	'varying vec4 v_Color; //color\n' +
	'const float PI = 3.1415926535897932384626433832795;\n' +
	'const vec3 sphereLight = vec3(0.5,0.5,1.0);\n' +
	'\n' +
	'void main()	{\n' +
	'	 vec4 vertPos4 = u_Scale * vec4(a_Position, 1);\n' +
	'	 vertPos4 = u_RotationX * vertPos4;\n' +
	'	 vertPos4 = u_RotationZ * vertPos4;\n' +
	'	 vertPos4 = u_Translation + vertPos4;\n' +
	'	 vertPos4 = u_ModelView * vertPos4;\n' +
  '	 v_VertPos = vec3(vertPos4) / vertPos4.w;\n' +
  '	 v_NormalInterp = vec3(u_NormalMat * vec4(a_Normal, 0.0));\n' +
  '	 gl_Position = u_Projection * vertPos4;\n' +
	'  vec3 N = normalize(v_NormalInterp);\n' +
	'  vec3 L = normalize(u_LightDirection);\n' +
	'  vec3 LS = normalize(u_SpherePosition - a_Position);\n' +
	'  // Lambert\'s cosine law\n' +
	'  float lambertian = max(dot(N, L), 0.0);\n' +
	'  float lambertianSphere = max(dot(N, LS), 0.0);\n' +
	'  float specular = 0.0;\n' +
	'  if(lambertian > 0.0) {\n' +
	'    vec3 R = reflect(-L, N);      // Reflected light vector\n' +
	'    vec3 V = normalize(-v_VertPos); // Vector to viewer\n' +
	'    // Compute the specular term\n' +
	'    float specAngle = max(dot(R, V), 0.0);\n' +
	'    specular += pow(specAngle, u_ShininessVal);\n' +
	'  }\n' +
	'  float specularSphere = 0.0;\n' +
	'  if(lambertianSphere > 0.0) {\n' +
	'    vec3 RS = reflect(-LS, N);      // Reflected light vector\n' +
	'    vec3 VS = normalize(-v_VertPos); // Vector to viewer\n' +
	'    // Compute the specular term\n' +
	'    float specAngle = max(dot(RS, VS), 0.0);\n' +
	'    specularSphere += pow(specAngle, u_ShininessVal);\n' +
	'  }\n' +
	'  vec3 diffuse;\n' +
	'	 if (u_SphereOn) {\n' +
	'    diffuse = (u_Color.rgb * ((u_LightColor * lambertian) + (sphereLight * lambertianSphere))) +\n' +
	'    (u_Ks * ((u_LightColor * specular) + (sphereLight * specularSphere)));\n' +	
	'	 }\n' +
	'	 else {\n' +
	'    diffuse = (u_Color.rgb * u_LightColor * lambertian) +\n' +
	'    (u_Ks *u_LightColor * specular);\n' +	
	'	 }\n' +
	'  if (u_Color.a == 1.0){\n' +
	'    if (u_PickedTree) {\n' + //  Draw in red if mouse is pressed
	'      v_Color = u_idColor;\n' +
  '  	 }\n' +
  '		 else {\n' +
	'    	 v_Color = vec4(diffuse, u_Color.a);\n' +
	'    }}\n' +
	// Wireframe color
	'  else\n' +
	'      v_Color = vec4(1.0, 0.0, 1.0, 1.0);\n' +
	'}\n';


// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
var r_id;
var g_points = [];  // The array for the position of a mouse press
var mouseVec = new Float32Array([0, 0, 0]);
var lastMouseDown = [0, 0, 0, 0];
var mode = 0;
var view = 1;
var proj = 0;
var smooth = 0;
var phong = 0;
var u_PickedTree;
var aspectRatio = 1;
var SpanX = 500;
var SpanY = 500;
var selected = 0;
var id = 0;
var u_NormalMat;
var spherePos = new Vector3([0, -100, 100]);
var sphereSelected = false;
var sphereID = 51;

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');
	canvas.oncontextmenu = () => false;
	aspectRatio = canvas.width/canvas.height;
	// Get the redering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
	
	var checkbox1 = document.getElementById("myCheck1");
		checkbox1.addEventListener('change', function () {
			if (checkbox1.checked) {
				view = 0;
				console.log("Sideview");
				draw(gl, u_ModelView, u_Projection);
			} 
			else {
				view = 1;
				console.log("Topview");
				draw(gl, u_ModelView, u_Projection);
			}
		});	
	
	var checkbox2 = document.getElementById("myCheck2");
		checkbox2.addEventListener('change', function () {
			if (checkbox2.checked) {
				console.log("Solid");
				mode = 1;
				draw(gl, u_ModelView, u_Projection);
			} 
			else {
				mode = 0;
				console.log("Wireframe");
				draw(gl, u_ModelView, u_Projection);
			}
		});	
	
	var checkbox4 = document.getElementById("myCheck4");
		checkbox4.addEventListener('change', function () {
			if (checkbox4.checked) {
				proj = 1;
				console.log("Orthographic");
				draw(gl, u_ModelView, u_Projection);
			} 
			else {
				proj = 0;
				console.log("Perspective");
				draw(gl, u_ModelView, u_Projection);
			}
		});	
	var checkbox5 = document.getElementById("myCheck5");
		checkbox5.addEventListener('change', function () {
		if (checkbox5.checked) {
			smooth = 1;
			console.log("Smooth");
			draw(gl, u_ModelView, u_Projection);
		} 
		else {
			smooth = 0;
			console.log("Flat");
			draw(gl, u_ModelView, u_Projection);
		}
	});	
	var checkbox6 = document.getElementById("myCheck6");
		checkbox6.addEventListener('change', function () {
		if (checkbox6.checked) {
			phong = 1;
			console.log("Phong");
			gl.uniform1i(u_Phong, phong);
			if (!initShaders(gl, FSHADER_SOURCE, VSHADER_SOURCE)) {
				console.log('Failed to intialize shaders.');
				return;
			}
			gl.uniform1i(u_Phong, phong);
			draw(gl, u_ModelView, u_Projection);
		} 
		else {
			phong = 0;
			console.log("Gourand");
			gl.uniform1i(u_Phong, phong);
			if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
				console.log('Failed to intialize shaders.');
				return;
			}
			gl.uniform1i(u_Phong, phong);
			draw(gl, u_ModelView, u_Projection);
		}
	});
	var submit = document.getElementById('loadbutton');
		submit.addEventListener('click', function () {
				draw(gl, u_ModelView, u_Projection);
		});

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}
	var u_SphereOn = gl.getUniformLocation(gl.program, 'u_SphereOn');
	var sphereOn = gl.getUniform(gl.program, u_SphereOn);
	gl.uniform1i(u_SphereOn, true);
	var u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
	if (!u_Ks) {
		console.log('Failed to get the storage location of u_Ks');
		return;
	}
	gl.uniform3f(u_Ks, 1.0, 1.0, 1.0);
	// Specify the color for clearing <canvas>
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	u_PickedTree = gl.getUniformLocation(gl.program, 'u_PickedTree');
	if (!u_PickedTree) { 
	  console.log('Failed to get uniform variable(s) storage location');
	  return;
	}
	gl.uniform1i(u_PickedTree, 0); // Pass false to u_Clicked
	// Get the storage locations of u_ViewMatrix and u_ProjMatrix variables and u_Translate
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
	if (!u_LightDirection) { 
	  console.log('Failed to get uniform variable(s) storage location');
	  return;
	}
	 // Set the light color (white)
	gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
	// Set the light direction (in the world coordinate)
	var lightDirection = new Vector3([1, 1, 1]);
	lightDirection.normalize();     // Normalize
	gl.uniform3fv(u_LightDirection, lightDirection.elements);

	var u_ModelView = gl.getUniformLocation(gl.program, 'u_ModelView');
	var u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
	if (!u_Projection) { 
	 	console.log('Failed to get u_Projection storage location');
  	return;
	}
	if (!u_ModelView) { 
	 	console.log('Failed to get u_ModelView storage location');
  	return;
	}
	
	var u_Scale = gl.getUniformLocation(gl.program, 'u_Scale');
	if (!u_Scale) { 
	  console.log('Failed to get uniform variable(s) storage location');
	  return;
	}
	var scale = new Matrix4();
	scale.setScale(1, 1, 1);
	gl.uniformMatrix4fv(u_Scale, false, scale.elements);
	
	var u_RotationX = gl.getUniformLocation(gl.program, 'u_RotationX');
	var u_RotationZ = gl.getUniformLocation(gl.program, 'u_RotationZ');
	if (!u_RotationX || !u_RotationZ) { 
	  console.log('Failed to get uniform variable(s) storage location');
	  return;
	}
	rotationX = new Matrix4();
	rotationZ = new Matrix4();

	rotationX.setRotate(0, 0, 0, 1);
	gl.uniformMatrix4fv(u_RotationX, false, rotationX.elements);
	rotationZ.setRotate(0, 0, 0, 1);
	gl.uniformMatrix4fv(u_RotationZ, false, rotationZ.elements);
	
	// Register function (event handler) to be called on a mouse press
  u_NormalMat = gl.getUniformLocation(gl.program, 'u_NormalMat');
	if (!u_NormalMat) { 
	  console.log('Failed to get uniform variable(s) storage location');
	  return;
	}  
	var modelMatrix = new Matrix4();   // Model matrix
	var normalMat = new Matrix4();  // Transformation matrix for normal
	var modelViewInv = new Matrix4();
	var modelView = new Matrix4();
	
	// Calculate the model matrix
	modelMatrix.setTranslate(0, 0, 0); // Translate to y-axis direction
	modelMatrix.rotate(0, 0, 0, 1);   // Rotate around the z-axis
	
	// Calculate matrix to transform normal based on the model matrix
	normalMat.setInverseOf(modelMatrix);
	normalMat.transpose();
  modelViewInv.setInverseOf(modelView);
  normalMat.transpose(modelViewInv);
	// Pass the transformation matrix for normal to u_NormalMatrix
	gl.uniformMatrix4fv(u_NormalMat, false, normalMat.elements);

	canvas.onmousedown = function(ev){ mouseDown(ev, gl, canvas, u_ModelView, u_Projection); };
	canvas.onmouseup = function(ev){ mouseUp(ev, gl, canvas, u_ModelView, u_Projection); };
	canvas.onwheel = function(ev){ wheel(ev, gl, canvas, u_ModelView, u_Projection); };

	draw(gl, u_ModelView, u_Projection);
}
/*
Handles the different viewing, like orthographic, perspective, top, and side
*/
function setViewMatrix(gl, u_ModelView, u_Projection){
	var projection = new Matrix4();
	var modelView = new Matrix4();
	if (proj == 0){
		projection.setOrtho(-SpanX, SpanX, -SpanY, SpanY, -1000, 1000);
	}
	else {
		projection.setPerspective(60, aspectRatio, 1, 2000);
	}
	if (view == 0){
		modelView.setLookAt(0, -400, 75, 0, 1, 0, 0, 0, 1);
	}
	else {
		modelView.setLookAt(0, 0, 400, 0, 0, 0, 0, 1, 0);		
	}

	var normalMat = new Matrix4();  // Transformation matrix for normal
	var modelViewInv = new Matrix4();
	
	// Calculate matrix to transform normal based on the model matrix
	normalMat.setInverseOf(modelView);
	normalMat.transpose();
  modelViewInv.setInverseOf(modelView);
  normalMat.transpose(modelViewInv);
	// Pass the transformation matrix for normal to u_NormalMatrix
	gl.uniformMatrix4fv(u_NormalMat, false, normalMat.elements);
	gl.uniformMatrix4fv(u_Projection, false, projection.elements);
	gl.uniformMatrix4fv(u_ModelView, false, modelView.elements);
}
/*
Saves scenes. Unmodified from Fahim's example.
*/
function save(filename) {
	var savedata = document.createElement('a');
	savedata.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(g_points));
	savedata.setAttribute('download', filename);
	savedata.style.display = 'none';
	document.body.appendChild(savedata);
	savedata.click();
	document.body.removeChild(savedata);
}
/*
Loads scenes. Unmodified from Fahim's example.
*/
function load() {
  var Loadfile = document.getElementById("loadscene").files[0];
  var reader = new FileReader();
  reader.readAsText(Loadfile);
  reader.onload = function () {
  	var len = this.result.length;
  	var data = this.result.slice(1, len);
  	var xyb = data.split(',');
  	for (var i = 0; i < xyb.length; i=i+4) {
			g_points.push(([parseFloat(xyb[i]), parseFloat(xyb[i+1]), parseFloat(xyb[i+2]), parseFloat(xyb[i+3])]));
  	}
  };	
	console.log("g_points: ", g_points);
}
/*
Executed when the middle, right, or left mouse buttons are pressed.
*/
function mouseDown(ev, gl, canvas, u_ModelView, u_Projection) {	
  // Write the positions of vertices to a vertex shader
	var x = ev.clientX; // x coordinate of a mouse pointer
	var y = ev.clientY; // y coordinate of a mouse pointer
	var rect = ev.target.getBoundingClientRect();
	var btn = ev.button;
	
	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
	var x_in_canvas = ev.clientX - rect.left, y_in_canvas = rect.bottom - ev.clientY;
	gl.uniform1i(u_PickedTree, 1); // Pass false to u_Clicked
  lastMouseDown[0] = x;
  lastMouseDown[1] = y;
  lastMouseDown[2] = btn;
}
/*
Executed when the middle, right, or left mouse buttons are released.
*/
function mouseUp(ev, gl, canvas, u_ModelView, u_Projection) {
  // Write the positions of vertices to a vertex shader
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();
  var x_in_canvas = ev.clientX - rect.left, y_in_canvas = rect.bottom - ev.clientY;
  var btn = ev.button;
  var gLastIndex = g_points.length - 1;
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  var z = 0;
  mouseVec = [x - lastMouseDown[0], y - lastMouseDown[1], 0];
  draw(gl, u_ModelView, u_Projection);
  var pixels = new Uint8Array(4); // Array for storing the pixel value
	gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	console.log("pixel color value = " + pixels);
	idx = Math.round(pixels[0]/5);
	console.log("id value = " + idx);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
	gl.uniform1i(u_PickedTree, 0); // Pass false to u_Clicked(rewrite the cube)	
	if (mode == 0  && mouseVec[0] == 0 && mouseVec[1] == 0 && btn != 1) {
		if (selected == 0 && !sphereSelected) {
			if (pixels[0] == 0) {
				var translate = new Vector4();
				var rotationX = new Matrix4();
				var rotationZ = new Matrix4();
				var scale = new Matrix4();
				g_points.push([x, y, btn, ++id, translate, rotationX, rotationZ, scale, z]); //format: [mouse x location, mouse y location, mouse button/tree type, tree id]
			}
			else if (pixels[0] == 255 && lastMouseDown[2] == 0) {
				sphereSelected = true;
			}
			else if (pixels[0] == 255 && lastMouseDown[2] == 2) {
				var u_SphereOn = gl.getUniformLocation(gl.program, 'u_SphereOn');
				var sphereOn = gl.getUniform(gl.program, u_SphereOn);
				gl.uniform1i(u_SphereOn, !sphereOn);

				sphereOn = gl.getUniform(gl.program, u_SphereOn);
				console.log('sphereOn: ', sphereOn);
			}
			else {
				g_points[(idx-1)][2]++;
				selected = idx;
			}
		}
		else if (selected > 0 || sphereSelected) {
			if (pixels[0] == 0) {
				if (selected > 0) {
					g_points[(selected-1)][2]--;
					selected = 0;
				}
				sphereSelected = false;
			}
		}
	}
	draw(gl, u_ModelView, u_Projection);
 	console.log('mouseVec:', mouseVec);
 	mouseVec = [0, 0, 0];
}
/*
Handles mouse scrolling. Adjusts the scale matrixf.
*/
function wheel(ev, gl, canvas, u_ModelView, u_Projection) {
  draw(gl, u_ModelView, u_Projection);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
	if (selected > 0) {
		ev.preventDefault();
		var u_Scale = gl.getUniformLocation(gl.program, 'u_Scale');
		if (!u_Scale) { 
		  console.log('Failed to get uniform variable(s) storage location');
		  return;
		}
		var s;
		var currentScale = gl.getUniform(gl.program, u_Scale);
		if (ev.deltaY > 0) {
			s = currentScale[0] * 0.5;
		}
		else {
			s = currentScale[0] * 2.0;
		}
		g_points[idx-1][7].scale(s, s, s);
		gl.uniformMatrix4fv(u_Scale, false, g_points[idx-1][7].elements);
	}
	draw(gl, u_ModelView, u_Projection);
}
/*
Draws the entire scene.
*/
function draw(gl, u_ModelView, u_Projection) {
	setViewMatrix(gl, u_ModelView, u_Projection);
	var len = g_points.length;
	var u_RotationX = gl.getUniformLocation(gl.program, 'u_RotationX');
	var u_RotationZ = gl.getUniformLocation(gl.program, 'u_RotationZ');
	var u_Scale = gl.getUniformLocation(gl.program, 'u_Scale');
	if (!u_RotationX || !u_RotationZ) { 
	  console.log('Failed to get uniform variable(s) storage location');
	  return;
	}
	for(var i = 0; i < len; i++) {
		var xy = g_points[i];
		gl.uniformMatrix4fv(u_RotationX, false, g_points[xy[3]-1][5].elements);
		gl.uniformMatrix4fv(u_RotationZ, false, g_points[xy[3]-1][6].elements);
		gl.uniformMatrix4fv(u_Scale, false, g_points[xy[3]-1][7].elements);
		drawTree(gl, u_ModelView, u_Projection, xy);
	}
	var scale = new Matrix4();
	var s = 5;
	scale.setScale(s, s * aspectRatio, s, 1);
	var u_Scale = gl.getUniformLocation(gl.program, 'u_Scale');
	if (!u_Scale) {
		console.log('Failed to get the storage location of u_Scale');
		return;
	}
	var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
	if (!u_Translation) {
		console.log('Failed to get the storage location of u_Translation');
		return;
	}
	var u_SpherePosition = gl.getUniformLocation(gl.program, 'u_SpherePosition');
	if (!u_SpherePosition) { 
	  console.log('Failed to get uniform variable(s) storage location');
	  return;
	}
	if (sphereSelected) {
		spherePos.elements[0] += mouseVec[0] * SpanX;
		spherePos.elements[1] += mouseVec[1] * SpanY;
		if (lastMouseDown[2] == 1) {
			spherePos.elements[2] += mouseVec[1] * SpanY;
		}
	}
	gl.uniform4f(u_Translation, spherePos.elements[0], spherePos.elements[1], spherePos.elements[2], 1);
	gl.uniform3fv(u_SpherePosition, spherePos.elements);
	gl.uniformMatrix4fv(u_Scale, false, scale.elements);
	drawSphere(gl);
}
/*
Draws one tree.
*/
function drawTree(gl, u_ModelView, u_Projection, xy) {
	if(xy[2] == 0)
	var v = new Float32Array(treeR3);
	else
	var v = new Float32Array(treeR4);  
 
	var n = v.length;
	var r1 = 0;
	var r2 = 0;
	if (xy[3] == selected) {
		if (lastMouseDown[2] == 0) {
			g_points[xy[3]-1][0] += mouseVec[0];
			g_points[xy[3]-1][1] += mouseVec[1];

			g_points[xy[3]-1][4].elements[0] += mouseVec[0] * SpanX;
			g_points[xy[3]-1][4].elements[1] += mouseVec[1] * SpanY;
			g_points[xy[3]-1][4].elements[2] = mouseVec[2];
			g_points[xy[3]-1][4].elements[3] = 1;
		}
		else if (lastMouseDown[2] == 2) {
			var u_RotationX = gl.getUniformLocation(gl.program, 'u_RotationX');
			var u_RotationZ = gl.getUniformLocation(gl.program, 'u_RotationZ');
			if (!u_RotationX || !u_RotationZ) { 
			  console.log('Failed to get uniform variable(s) storage location');
			  return;
			}
			g_points[xy[3]-1][5].rotate(-mouseVec[1] * 50, 1, 0, 0);
			gl.uniformMatrix4fv(u_RotationX, false, g_points[xy[3]-1][5].elements);
			g_points[xy[3]-1][6].rotate(-mouseVec[0] * 50, 0, 0, 1);
			gl.uniformMatrix4fv(u_RotationZ, false, g_points[xy[3]-1][6].elements);
		}
		else {
			g_points[xy[3]-1][8] += mouseVec[1];
		}
	}
	for(var i = 0; i < n; i=i+6) {
		var d = Math.sqrt((v[i]-v[i+3])*(v[i]-v[i+3])+(v[i+1]-v[i+4])*(v[i+1]-v[i+4])+(v[i+2]-v[i+5])*(v[i+2]-v[i+5]));
		drawCylinder(gl, u_ModelView, u_Projection, v[i],v[i+1],v[i+2], v[i+3],v[i+4],v[i+5], d, xy);
	}
}
/*
Draws one cylinder.
*/
function drawCylinder(gl, u_ModelView, u_Projection, x1, y1, z1, x2, y2, z2, d, xy) {
	r1 = d/10;
	r2 = d/20;
	sides = 12;
	var cylinder = [];
	var Circle1 = [];
	var Circle2 = [];
	var normals = [];

	for (var i = 0; i <= sides; i++) {
		Circle1.push(r1 * Math.cos(i * Math.PI / 6), r1 * Math.sin(i * Math.PI / 6));
		Circle2.push(r2 * Math.cos(i * Math.PI / 6), r2 * Math.sin(i * Math.PI / 6));       
	}
	
	for (var i = 0; i < (sides*2); i=i+2) {
		cylinder.push(x2+Circle2[i], y2+Circle2[i+1], z2, 
		x1+Circle1[i], y1+Circle1[i+1], z1, 
		x2+Circle2[i+2], y2+Circle2[i+3], z2, 
		x2+Circle2[i+2], y2+Circle2[i+3], z2, 
		x1+Circle1[i], y1+Circle1[i+1], z1, 
		x1+Circle1[i+2], y1+Circle1[i+3], z1);
	}

	for (var i = 0; i <cylinder.length; i=i+9) {
		// Create Vectors
		var v1 = [cylinder[i], cylinder[i+1], cylinder[i+2]];
		var v2 = [cylinder[i+3], cylinder[i+4], cylinder[i+5]];
		var v3 = [cylinder[i+6], cylinder[i+7], cylinder[i+8]];
		var v21 = [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
		var v23 = [v3[0] - v2[0], v3[1] - v2[1], v3[2] - v2[2]];
				
		// Calculate Normals
		var N = [];
		var N1 = v23[1]*v21[2] - v23[2]*v21[1];
		var N2 = v21[0]*v23[2] - v21[2]*v23[0];
		var N3 = v23[0]*v21[1] - v23[1]*v21[0];

		N.push(N1, N2 ,N3);
		var Vmag = Math.sqrt(N[0]**2 + N[1]**2 + N[2]**2);
				
		N[0] = N[0]/Vmag;
		N[1] = N[1]/Vmag;
		N[2] = N[2]/Vmag;
		normals = normals.concat(N, N, N);
	}
	
	var vertices = new Float32Array(cylinder);
	var n = cylinder.length/3;

	// Create a buffer object
	var vertexbuffer = gl.createBuffer();  
	if (!vertexbuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
	// Write date into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	// Assign the buffer object to a_Position and enable the assignment
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if(a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);  
	var vN = new Float32Array(normals);

	// Create a buffer object
	var normalbuffer = gl.createBuffer();  
	if (!normalbuffer) {
		console.log('Failed to create the buffer object');
		return -1;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, normalbuffer);
	// Write date into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, vN, gl.STATIC_DRAW);

	// Assign the buffer object to a_Position and enable the assignment
	var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
	if(a_Normal < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Normal);

	// Pass the translation distance to the vertex shader
	var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
	if (!u_Translation) {
		console.log('Failed to get the storage location of u_Translation');
		return;
	}
	if (xy[3] == selected) {
		gl.uniform4f(u_Translation, SpanX*g_points[xy[3]-1][0], SpanY*g_points[xy[3]-1][1], SpanY*g_points[xy[3]-1][8]/4, 0);  
	}
	else {
		gl.uniform4f(u_Translation, SpanX*xy[0], SpanY*xy[1], SpanY*xy[8]/4, 0);
	}
	
  var u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  if (!u_Color) {
    console.log('Failed to get the storage location of u_Color');
    return;
  }
  
  var u_idColor = gl.getUniformLocation(gl.program, 'u_idColor');
  if (!u_idColor) {
    console.log('Failed to get the storage location of u_idColor');
    return;
  }
  var u_ShininessVal = gl.getUniformLocation(gl.program, 'u_ShininessVal');  
  if (!u_ShininessVal) {
		console.log('Failed to get the storage location of u_ShininessVal');
		return;
	}
  r_id = xy[3]/51; //Encoding tree id as color value (max 50 trees)
  
  gl.uniform4f(u_idColor, r_id, 1.0, 0.0, 1.0);
  if (mode == 0) {
		if(xy[2] == 0) {
			gl.uniform4f(u_Color, 1.0, 0.0, 0.0, 1.0);
			gl.uniform1f(u_ShininessVal, 5);
		}
		else if (xy[2] == 2) {
			gl.uniform4f(u_Color, 0.0, 0.0, 1.0, 1.0);
			gl.uniform1f(u_ShininessVal, 20);
		}
		else if (xy[2] == 1 || xy[2] == 3) {
			gl.uniform4f(u_Color, 0.0, 1.0, 0.0, 1.0);
		}
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
  }
  else if (mode == 1) {
		gl.uniform4f(u_Color, 1.0, 1.0, 1.0, 0);
		gl.drawArrays(gl.LINES, 0, n);
  }
}

function drawSphere(gl) { // Create a sphere
  var SPHERE_DIV = 13;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
  
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    // Set the vertex coordinates, the color and the normal
  var n = indices.length;
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  var u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  if (!u_Color) {
    console.log('Failed to get the storage location of u_Color');
    return;
  }
  var u_idColor = gl.getUniformLocation(gl.program, 'u_idColor');
  if (!u_idColor) {
    console.log('Failed to get the storage location of u_idColor');
    return;
  }
  r_id = sphereID/51; //Encoding tree id as color value (max 50 trees)
  
  gl.uniform4f(u_idColor, r_id, 1.0, 0.0, 1.0);
  if (sphereSelected) {
		gl.uniform4f(u_Color, 0, 1, 0, 1);
  }
  else {
		gl.uniform4f(u_Color, 1, 1, 0, 1);
  }
  // Draw the cube(Note that the 3rd argument is the gl.UNSIGNED_SHORT)
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}