/**
 * @author aussi / https://github.com/aussig
 * Heavily derived from OBJLoader @author mrdoob / http://mrdoob.com/
 * And from xptools @author Laminar Research
 */

THREE.XPlaneFacLoader = ( function () {

	function XPlaneFacLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

		this.roofMaterial = new THREE.MeshLambertMaterial();
		this.wallMaterial = new THREE.MeshLambertMaterial();
		this.roofMaterial.side = THREE.DoubleSide;
		this.wallMaterial.side = THREE.DoubleSide;
		// Set alphaTest to get a fairly good result for transparent textures. Non trivial problem though, see https://threejsfundamentals.org/threejs/lessons/threejs-transparency.html
		this.roofMaterial.alphaTest = 0.5;
		this.wallMaterial.alphaTest = 0.5;
		this.roofMaterial.transparent = true;
		this.wallMaterial.transparent = true;

	}

	XPlaneFacLoader.prototype = {

		constructor: XPlaneFacLoader,

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;
			var loader = new THREE.FileLoader( scope.manager );
			loader.setPath( this.path );
			loader.load( url, function ( text ) {

				onLoad( scope.parse( text ) );

			}, onProgress, onError );

		},

		setPath: function ( value ) {

			this.path = value;

			return this;

		},

		loadRoofTexture: function ( path ) {

			var scope = this;
			var textureLoader = new THREE.TextureLoader();
			var ddsLoader = new THREE.DDSLoader();

			// Spec says that even if the specified texture has a .png suffix, X-Plane will attempt to load a DDS
			// texture with equivalent .dds extension first. So we do the same.
			var splitPath = path.split('.');
			// Remove extension
			splitPath.pop();

			var ddsPath = splitPath.concat(['dds']).join('.');
			var pngPath = splitPath.concat(['png']).join('.');

			// DDS Texture loading currently disabled because of this bug https://github.com/mrdoob/three.js/issues/4316 - Compressed DDS textures load upside down
			ddsLoader.load(
				// resource URL
				ddsPath,

				// onLoad callback
				function ( texture ) {
					texture.anisotropy = 16;
					scope.roofMaterial.map = texture;
					scope.roofMaterial.map.needsUpdate = true;
					scope.roofMaterial.needsUpdate = true;
				},

				// onProgress callback
				undefined,

				// onError callback
				function ( err ) {
					textureLoader.load(
						// resource URL
						pngPath,

						// onLoad callback
						function ( texture ) {
							texture.anisotropy = 16;
							scope.roofMaterial.map = texture;
							scope.roofMaterial.map.needsUpdate = true;
							scope.roofMaterial.needsUpdate = true;
						},

						// onProgress callback
						undefined,

						// onError callback
						function ( err ) {
							console.error( 'Could not load texture. Tried ' + ddsPath + ' and ' + pngPath );
						}
					);
				}
			);

			return this;

		},

		loadWallTexture: function ( path ) {

			var scope = this;
			var textureLoader = new THREE.TextureLoader();
			var ddsLoader = new THREE.DDSLoader();

			// Spec says that even if the specified texture has a .png suffix, X-Plane will attempt to load a DDS
			// texture with equivalent .dds extension first. So we do the same.
			var splitPath = path.split('.');
			// Remove extension
			splitPath.pop();

			var ddsPath = splitPath.concat(['dds']).join('.');
			var pngPath = splitPath.concat(['png']).join('.');

			// DDS Texture loading currently disabled because of this bug https://github.com/mrdoob/three.js/issues/4316 - Compressed DDS textures load upside down
			ddsLoader.load(
				// resource URL
				ddsPath,

				// onLoad callback
				function ( texture ) {
					texture.anisotropy = 16;
					scope.wallMaterial.map = texture;
					scope.wallMaterial.map.needsUpdate = true;
					scope.wallMaterial.needsUpdate = true;
				},

				// onProgress callback
				undefined,

				// onError callback
				function ( err ) {
					textureLoader.load(
						// resource URL
						pngPath,

						// onLoad callback
						function ( texture ) {
							texture.anisotropy = 16;
							scope.wallMaterial.map = texture;
							scope.wallMaterial.map.needsUpdate = true;
							scope.wallMaterial.needsUpdate = true;
						},

						// onProgress callback
						undefined,

						// onError callback
						function ( err ) {
							console.error( 'Could not load texture. Tried ' + ddsPath + ' and ' + pngPath );
						}
					);
				}
			);

			return this;

		},

		parse: function ( text ) {

			console.time( 'XPlaneFacLoader' );

			if ( text.indexOf( '\r\n' ) !== - 1 ) {

				// This is faster than String.split with regex that splits on both
				text = text.replace( /\r\n/g, '\n' );

			}

			var lines = text.split( '\n' );
			var line = '';

			// Faster to just trim left side of the line. Use if available.
			var trimLeft = ( typeof ''.trimLeft === 'function' );

			var facadeInfo = this.getFacadeInfo();
			var facadeTmpl = null;

			var scaleS = 1.0;
			var scaleT = 1.0;
			var roofSection = false;
			var nearestLOD = true;


			for ( var i = 0, l = lines.length; i < l; i++ ) {

				line = lines[ i ];
				line = trimLeft ? line.trimLeft() : line.trim();

				// Ignore various unimportant lines
				if ( line.length === 0 ) continue;
				// Note that we fail on '1000' as we don't handle type 2 facades yet
				if ( line.charAt( 0 ) === '#' || line === 'I' || line === 'A' || line === '800' || line === 'FACADE' ) continue;
				if ( line === '1000' ) {
					facadeInfo.type = 2;
					continue;
				}

				var data = line.split( /\s+/ );

				if ( data[ 0 ] == 'LOD' ) {
					nearestLOD = (parseFloat(data[ 1 ]) == 0);
					continue;
				}

				if ( !nearestLOD ) continue;

				switch ( data[ 0 ] ) { // Common Facade Commands

					case 'SHADER_ROOF':
						roofSection = true;
						continue;

					case 'SHADER_WALL':
						roofSection = false;
						continue;

					case 'TEXTURE':
						if (roofSection)
							this.loadRoofTexture( this.path + data[ 1 ] );
						else
							this.loadWallTexture( this.path + data[ 1 ] );
						continue;

					case 'WALL':
						roofSection = false;

						if ( facadeInfo.type == 1 ) {
							facadeInfo.walls.push(this.getV1FacadeWallTemplate());
						} else {
							var wallTemplate = this.getV2FacadeWallTemplate();
							var wallFilterTemplate = this.getV2FacadeWallFilterTemplate();
							wallFilterTemplate.minWidth = parseFloat(data[ 1 ]);
							wallFilterTemplate.maxWidth = parseFloat(data[ 2 ]);
							wallFilterTemplate.minHeading = parseFloat(data[ 3 ]);
							wallFilterTemplate.maxHeading = parseFloat(data[ 4 ]);
							wallTemplate.filters.push(wallFilterTemplate);
							facadeInfo.floors[facadeInfo.floors[length - 1]].walls.push(wallTemplate);
						}

						continue;

					case 'RING':
						facadeInfo.isRing = parseInt(data[ 1 ]) > 0;
						continue;

					case 'TWO_SIDED':
						facadeInfo.twoSided = parseInt(data[ 1 ]) > 0;
						continue;

					case 'FACADE_SCRAPER':
					case 'FACADE_SCRAPER_MODEL':
					case 'FACADE_SCRAPER_MODEL_OFFSET':
					case 'NO_BLEND':
						// Lines we are ignoring right now (some may be implemented later)
						continue;

				}

				if ( facadeInfo.type == 1 ) { // Type 1 only Facade Commands

					switch ( data[ 0 ] ) {
						case 'SCALE':
							facadeInfo.walls[facadeInfo.walls.length - 1].xScale = parseFloat(data[ 1 ]);
							facadeInfo.walls[facadeInfo.walls.length - 1].yScale = parseFloat(data[ 2 ]);
							continue;

						case 'ROOF_SLOPE':
							facadeInfo.walls[facadeInfo.walls.length - 1].roofSlope = parseFloat(data[ 1 ]);
							if ( facadeInfo.walls[facadeInfo.walls.length - 1].roofSlope >= 90.0 ||
								facadeInfo.walls[facadeInfo.walls.length - 1].roofSlope <= -90.0 ) {
								facadeInfo.texCorrectSlope = true;
							}

							if ( data.length > 2 && data[ 2 ] == "SLANT") {
								facadeInfo.texCorrectSlope = true;
							}
							continue;

						case 'BOTTOM':
							var f1 = parseFloat(data[ 1 ]) * scaleT;
							var f2 = parseFloat(data[ 2 ]) * scaleT;
							facadeInfo.walls[facadeInfo.walls.length - 1].tFloors.push([f1, f2]);
							facadeInfo.walls[facadeInfo.walls.length - 1].bottom++;
							continue;

						case 'MIDDLE':
							var f1 = parseFloat(data[ 1 ]) * scaleT;
							var f2 = parseFloat(data[ 2 ]) * scaleT;
							facadeInfo.walls[facadeInfo.walls.length - 1].tFloors.push([f1, f2]);
							facadeInfo.walls[facadeInfo.walls.length - 1].middle++;
							continue;

						case 'TOP':
							var f1 = parseFloat(data[ 1 ]) * scaleT;
							var f2 = parseFloat(data[ 2 ]) * scaleT;
							facadeInfo.walls[facadeInfo.walls.length - 1].tFloors.push([f1, f2]);
							facadeInfo.walls[facadeInfo.walls.length - 1].top++;
							continue;

						case 'LEFT':
							var f1 = parseFloat(data[ 1 ]) * scaleS;
							var f2 = parseFloat(data[ 2 ]) * scaleS;
							facadeInfo.walls[facadeInfo.walls.length - 1].sPanels.push([f1, f2]);
							facadeInfo.walls[facadeInfo.walls.length - 1].left++;
							continue;

						case 'CENTER':
							var f1 = parseFloat(data[ 1 ]) * scaleS;
							var f2 = parseFloat(data[ 2 ]) * scaleS;
							facadeInfo.walls[facadeInfo.walls.length - 1].sPanels.push([f1, f2]);
							facadeInfo.walls[facadeInfo.walls.length - 1].center++;
							continue;

						case 'RIGHT':
							var f1 = parseFloat(data[ 1 ]) * scaleS;
							var f2 = parseFloat(data[ 2 ]) * scaleS;
							facadeInfo.walls[facadeInfo.walls.length - 1].sPanels.push([f1, f2]);
							facadeInfo.walls[facadeInfo.walls.length - 1].right++;
							continue;

						case 'ROOF':
							facadeInfo.roofS.push(parseFloat(data[ 1 ]) * scaleS);
							facadeInfo.roofT.push(parseFloat(data[ 2 ]) * scaleT);
							facadeInfo.hasRoof = true;
							continue;

						case 'ROOF_SCALE':
							facadeInfo.roofST[0] = parseFloat(data[ 1 ]) * scaleS;
							facadeInfo.roofST[1] = parseFloat(data[ 2 ]) * scaleT;
							var sCTR = parseFloat(data[ 3 ]) * scaleS;
							var tCTR = parseFloat(data[ 4 ]) * scaleT;
							facadeInfo.roofST[2] = parseFloat(data[ 5 ]) * scaleS;
							facadeInfo.roofST[3] = parseFloat(data[ 6 ]) * scaleT;
							var rsX = parseFloat(data[ 7 ]);
							var rsY = parseFloat(data[ 8 ]);
							var sRAT = (sCTR - facadeInfo.roofST[0]) / (facadeInfo.roofST[2] - facadeInfo.roofST[0]);  // fraction of tex below/left center point
							var tRAT = (tCTR - facadeInfo.roofST[1]) / (facadeInfo.roofST[3] - facadeInfo.roofST[1]);
							facadeInfo.roofAB[0] = -rsX * sRAT;          // number of meters that are below/left of center point, always negative
							facadeInfo.roofAB[1] = -rsY * tRAT;
							facadeInfo.roofAB[2] = facadeInfo.roofAB[0] + rsX;    // number of meters that are above/right of center point
							facadeInfo.roofAB[3] = facadeInfo.roofAB[1] + rsY;
							facadeInfo.hasRoof = true;
							continue;

						case 'BASEMEMT_DEPTH':
							facadeInfo.walls[facadeInfo.walls.length - 1].basement = parseFloat(data[ 1 ]) * scaleT;
							continue;

						case 'TEX_SIZE':
							scaleS = parseFloat(data[ 1 ]);
							scaleT = parseFloat(data[ 2 ]);
							continue;

						case 'FLOORS_MIN':
							facade.minFloors = parseFloat(data[ 1 ]);
							continue;

						case 'FLOORS_MAX':
							facade.maxFloors = parseFloat(data[ 1 ]);
							continue;

						case 'DOUBLED':
							facadeInfo.doubled = parseInt(data[ 1 ]) > 0;
							continue;

						default:

							// Handle null terminated files without exception
							if ( line === '\0' ) continue;

							throw new Error( 'THREE.XPlaneFacLoader: Unexpected line: "' + line + '"' );

					}

				} else { // Type 2 only Facade Commands

					switch ( data[ 0 ] ) {

						case 'OBJ':
							facadeInfo.objs.push(data[ 1 ]);
							continue;

						case 'FLOOR':
							var facadeFloorTemplate = this.getV2FacadeFloorTemplate();
							facadeFloorTemplate.roofSurface = 0;
							facadeInfo.floors.push(facadeFloorTemplate);
							continue;

						case 'SEGMENT':
							facadeTmpl = this.getV2FacadeTemplate();
							facadeInfo.floors[facadeInfo.floors.length - 1].templates.push(facadeTmpl);
							continue;

						case 'SEGMENT_CURVED':
							facadeTmpl = null;
							continue;

						case 'MESH':
							if (facadeTmpl) {
								facadeTmpl.meshes.push(facadeTmpl.mesh());
							}
							continue;

						case 'VERTEX':
							if (facadeTmpl) {
								var mesh = facadeTmpl.meshes[facadeTmpl.meshes.length - 1];
								mesh.xyz.push(parseFloat(data[ 1 ]));
								mesh.xyz.push(parseFloat(data[ 2 ]));
								mesh.xyz.push(parseFloat(data[ 3 ]));
								mesh.uv.push(parseFloat(data[ 7 ]));
								mesh.uv.push(parseFloat(data[ 8 ]));
							}
							continue;

						case 'IDX':
							if (facadeTmpl) {
								var mesh = facadeTmpl.meshes[facadeTmpl.meshes.length - 1];
								for (var j = 1; j < data.length; j++) mesh.idx.push(parseInt(data[ j ]));
							}
							continue;

						case 'ATTACH_DRAPED':
						case 'ATTACH_GRADED':
							if (facadeTmpl) {
								var object = facadeTmpl.object();
								object.idx = parseInt(data[ 1 ]);
								object.xyzr[0] = parseFloat(data[ 2 ]);
								object.xyzr[1] = parseFloat(data[ 3 ]);
								object.xyzr[2] = parseFloat(data[ 4 ]);
								object.xyzr[3] = parseFloat(data[ 5 ]);
								facadeTmpl.objs.push(object);
							}
							continue;

						case 'SPELLING':
							var spelling = this.getV2FacadeSpelling();
							for (var j = 1; j < data.length; j++) spelling.indices.push(parseInt(data[ j ]));
							facadeInfo.floors[facadeInfo.floors.length - 1].walls[facadeInfo.walls.length - 1].spellings.push(spelling);
							continue;

						case 'ROOF_HEIGHT':
							for (var j = 1; j < data.length; j++)
								facadeinfo.floors[facadeinfo.floors.length - 1].roofs.push(getV2FacadeRoofTemplate(parseFloat(data[ j ])));
							facadeinfo.hasRoof = true;
							continue;

						case 'ROOF_SCALE':
							facadeInfo.roofScaleS = parseFloat(data[ 1 ]);
							facadeInfo.roofScaleT = parseFloat(data[ 2 ]);
							if (facadeInfo.roofScaleT == 0.0) facadeInfo.roofScaleT = facadeInfo.roofScaleS;
							continue;

						case 'NO_ROOF_MESH':
							facadeInfo.noRoofMesh = true;
							continue;

						case 'NO_WALL_MESH':
							facadeInfo.noWallMesh = true;
							continue;

						case 'ROOF_OBJ':
							if(facadeInfo.floors.length == 0 || facadeInfo.floors[facadeInfo.floors.length - 1].roofs.length == 0)
								throw new Error( 'THREE.XPlaneFacLoader: This facade uses a roof object that is not inside a roof.' );
							else
								var index = parseInt(data[ 1 ]);
								var s = parseFloat(data[ 2 ]) / facadeInfo.roofScaleS;
								var t = parseFloat(data[ 3 ]) / facadeInfo.roofScaleT;
								var floor = facadeInfo.floors[facadeInfo.floors.length - 1];
								var roof = floor.roofs[floor.roofs.length - 1];
								roof.roofObjs.push(roof.roofObjs.roofObj(s, t, 0.0, index));
							continue;

						case 'ROOF_OBJ_HEADING':
							if(facadeInfo.floors.length == 0 || facadeInfo.floors[facadeInfo.floors.length - 1].roofs.length == 0)
								throw new Error( 'THREE.XPlaneFacLoader: This facade uses a roof object that is not inside a roof.' );
							else
								var index = parseInt(data[ 1 ]);
								var s = parseFloat(data[ 2 ]) / facadeInfo.roofScaleS;
								var t = parseFloat(data[ 3 ]) / facadeInfo.roofScaleT;
								var r = parseFloat(data[ 4 ]);
								var floor = facadeInfo.floors[facadeInfo.floors.length - 1];
								var roof = floor.roofs[floor.roofs.length - 1];
								roof.roofObjs.push(roof.roofObjs.roofObj(s, t, r, index));
							continue;

						default:

							// Handle null terminated files without exception
							if ( line === '\0' ) continue;

							throw new Error( 'THREE.XPlaneFacLoader: Unexpected line: "' + line + '"' );

					}
				}
			}

			if ( facadeInfo.type == 2 ) {
				facadeInfo.floors.forEach(function(f) {
					f.templates.forEach(function(t) {
						var xyzMin = [ 9.9e9,  9.9e9,  9.9e9 ];
						var xyzMax = [ -9.9e9, -9.9e9, -9.9e9 ];

						t.meshes.forEach(function(m) {
							for ( var i = 0; i < m.xyz.length; i +=3 ) {
								var p = m.xyz[i];
								xyzMin[0] = Math.min(xyzMin[0], p[0]);
								xyzMax[0] = Math.max(xyzMax[0], p[0]);
								xyzMin[2] = Math.min(xyzMin[2], p[2]);
								xyzMax[2] = Math.max(xyzMax[2], p[2]);
							}
						});

						t.bounds[0] = xyzMax[0]- xyzMin[0];   // to IF ring=0 objects that aren't true verical fences, like jetways
						t.bounds[1] = xyzMax[0];              // to ID walls that protrude outwards from roofs
						t.bounds[2] = xyzMax[2] - xyzMin[2];  // used all thoughout to scale segment widths

						// normalize z-direction coordinates
						t.meshes.forEach(function(m) {
							for ( var i = 0; i < m.xyz.length; i +=3 )
								m.xyz[i+2] = this.interp(xyzMin[2], 0.0, xyzMax[2], 1.0, m.xyz[ i + 2 ]) - 1;
						});
					});

					f.walls.forEach(function(w) {
						w.spellings.forEach(function(s) {
							s.total = 0.0;
							s.indices.forEach(function(b) {
								s.total += f.templates[b].bounds[2];
								s.widths.push(f.templates[b].bounds[2]);
							});
						});
						w.spellings.sort();
					});
				});
				if ( facadeInfo.noRoofMesh ) facadeInfo.hasRoof = false;
			}

			var container = new THREE.Group();

			// Add facade
			//this.addFacade( container, walls, roofUV, scaleX, scaleY, floorsMin, floorsMax, ring, roof );

			console.timeEnd( 'XPlaneFacLoader' );

			return container;

		},

		getFacadeInfo: function () {
			return {
				type: 1,
				isRing: true,
				doubled: false,
				twoSided: false,
				minFloors: 1,
				maxFloors: 999,
				hasRoof: false,
				noRoofMesh: false,
				noWallMesh: false,
				scrapers: [],
				floors: [],
				objs: [],
				roofScaleS: 0.0,
				roofScaleT: 0.0,

				texCorrectSlope: false,
				walls: [],
				roofS: [],
				roofT: [],
				roofST: [0.0, 0.0, 0.0, 0.0],
				roofAB: [0.0, 0.0, 0.0, 0.0]
			}
		},

		getV1FacadeWallTemplate: function() {
			return {
				xScale: 0.0,
				yScale: 0.0,
				basement: 0.0,
				roofSlope: 0.0,
				sPanels: [0.0, 0.0],
				left: 0,
				center: 0,
				right: 0,
				tFloors: [0.0, 0.0],
				bottom: 0,
				middle: 0,
				top: 0
			}
		},

		getV2FacadeTemplate: function () {
			return {
				object: function() {
					return {
						index: 0,
						xyzr: [0.0, 0.0, 0.0, 0.0]
					}
				},

				mesh: function() {
					return {
						xyz: [0.0, 0.0, 0.0],
						uv: [0.0, 0.0],
						idx: []
					}
				},

				objs: [],
				meshes: [],
				bounds: [0.0, 0.0, 0.0]
			}
		},

		getV2FacadeWallTemplate: function () {
			return {
				spellings: []
			}
		},

		getV2FacadeRoofTemplate: function (height) {
			return {
				roofObj: function(s, t, r, index) {
					return {
						str: [s, t, r],
						obj: index
					}
				},
				roofHeight: height,
				twoSided: 0,
				roofObjs: []
			}
		},

		getV2FacadeFloorTemplate: function () {
			return {
				templates: [],
				roofSurface: 0,
				walls: [],
				roofs: [],
				max_roof_height: function() {
					return this.roofs.length == 0 ? 0.0 : roofs[this.roofs.length].roof_height;
				}
			}
		},

		getV2FacadeWallFilterTemplate: function () {
			return {
				minWidth: 0.0,
				maxWidth: 0.0,
				minHeading: 0.0,
				maxHeading: 0.0
			}
		},

		getV2FacadeWallFiltersTemplate: function () {
			return {
				filters: []
			}
		},

		getV2FacadeSpelling: function () {
			return {
				indices: [],
				widths: [],
				total: 0.0,

				clear: function() {
					this.indices = [];
					this.widths = [];
					this.total = 0.0;
				},

				empty: function() {
					return this.indices.length == 0;
				}
			}
		},

		interp: function (x1, y1, x2, y2, x) {
			if( x1 == x2 ) return ( y1 + y2 ) * 0.5;
				return this.fltlim(y1+((y2-y1)/(x2-x1))*(x-x1), Math.min(y1, y2), Math.max(y1, y2));
		},

		fltlim: function (inValue, minValue, maxValue) {
			if ( inValue < min ) return minValue;
			if ( inValue > max ) return maxValue;
			return inValue;
		},

		addFacade: function ( container, walls, roofUV, scaleX, scaleY, floorsMin, floorsMax, ring, roof ) {
			var wantLen = 3;               // minimum size to draw as initial guess
			var wantFloors = 1;            // # floors in the way the Obj8 is constructed. Not the floors of the building/facade represents.
			var hasMiddles = false;        // if there are no middle sections in the walls, the facade will allow only one floor, i.e. is fixed height
			var quads;

			var vertices = [];
			var normals = [];
			var uvs = [];

			var vertexList = [];
			var uvList = [];

			if (walls.length == 0) return true;

			// Sanitise walls
			for (var i = 0; i < walls.length; i++) {
				if (walls[ i ].vert[ 1 ] == 0.0)
					break;

				if (walls[ i ].vert[ 2 ] == 0.0)
					walls[ i ].vert[ 2 ] = walls[ i ].vert[ 1 ];
				else
					hasMiddles = true;

				if (walls[ i ].vert[ 3 ] == 0.0)
					walls[ i ].vert[ 3 ] = walls[ i ].vert[ 2 ];
				else
					hasMiddles = true;

				if (walls[ i ].hori[ 2 ] == 0.0) {
					walls[ i ].hori[ 2 ] = walls[ i ].hori[ 1 ];
					walls[ i ].hori[ 1 ] = walls[ i ].hori[ 0 ];
				}

				if (walls[ i ].hori[ 3 ] == 0.0)
					walls[ i ].hori[ 3 ] = walls[ i ].hori[ 2 ];

				var idealLen = (walls[ i ].hori[ 2 ] - walls[ i ].hori[ 0 ] + walls[ i ].hori[ 3 ] - walls[ i ].hori[ 1 ]) * scaleX;
				wantLen = Math.max( wantLen, idealLen );
			}

			if (hasMiddles)
				wantFloors = 2;
			else {
				floorsMin = -1.0;
				floorsMax = (walls[ 0 ].vert[ 2 ] - walls[ 0 ].vert[ 0 ]) * scaleY;
			}

			var x = 0.0;
			var y = 0.0;
			var z = 0.0;

			for (var level = 0; level < wantFloors; level++) {
				quads = 0;

				for (var fl = 0; fl <= 1; fl++) {
					x = 0.0;
					z = 0.0;

					if (fl) y += (walls[ 0 ].vert[ level + 2 ] - walls[ 0 ].vert[ level ]) * scaleY;   // height of each floor

					for (var i = 0; i <= 1; i++) {
						for (var j = 0; j <= 1; j++) {
							if (!ring && i && j) break;      // open facades (fences etc) drawn with 3 sides only

							// wall selection. We want to show off as many different walls as practical
							var w = 2 * i + j;
							if (w >= walls.length) w = 0;   // show default wall if we run out of varieties

							var t = walls[ w ].vert[ 2 * fl + level ];
							var lenLeft = wantLen - (walls[ w ].hori[ 2 ] - walls[ w ].hori[ 0 ] + walls[ w ].hori[ 3 ] - walls[ w ].hori[ 1 ]) * scaleX;
							var exact = 2.0 + lenLeft / ((walls[ w ].hori[ 2 ] - walls[ w ].hori[ 1 ]) * scaleX);
							var sects = Math.ceil(exact);

							for (var k = 0; k < sects; k++) {
								var s1 = walls[ w ].hori[ Math.min( k, 1 ) ];
								var s2 = walls[ w ].hori[ 2 + (k == sects - 1) ];
								var dx = (s2 - s1) * scaleX;

								vertexList.push( [ x, y, z ] );
								uvList.push( [ s1, t ] );

								if (j == 0) z += (1 - 2 * i) * dx * (1.0 - (k == sects - 2) * (sects - exact));
								else x += (1 - 2 * i) * dx * (1.0 - (k == sects - 2) * (sects - exact));

								vertexList.push( [ x, y, z ] );
								uvList.push( [ s2 - (s2 - s1) * (k == sects - 2) * (sects - exact), t ] );

								if (fl) quads++;
							}
						}
					}
				}

				var seq = [ 0, 1, 2 * quads, 1, 2 * quads + 1, 2 * quads ];
				for (var i = 0; i < 6 * quads; i++) {
					var vertexIndex = 2 * Math.floor(i / 6) + seq[ i % 6 ];
					vertices.push( vertexList[ vertexIndex ][ 0 ], vertexList[ vertexIndex ][ 1 ], vertexList[ vertexIndex ][ 2 ] );
					normals.push( 0.0, 1.0, 0.0 );
					uvs.push( uvList[ vertexIndex ][ 0 ], uvList[ vertexIndex ][ 1 ] );
				}
			}

			var geometry = new THREE.BufferGeometry( );
			geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
			geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
			geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

			var polygon = new THREE.Mesh( geometry, this.wallMaterial );
			container.add( polygon );
/*
			vertices = [];
			normals = [];
			uvs = [];

			vertexList = [];
			uvList = [];

			if (roof) {
				pt[1] = obj->xyz_max[1]; // height

				for (int i = 0; i<2; ++i)
					for (int j = 0; j<2; ++j)
					{
						pt[0] = i ? obj->xyz_min[0] : obj->xyz_max[0];
						pt[2] = j ? obj->xyz_min[2] : obj->xyz_max[2];

						pt[6] = roof_uv[2*i];
						pt[7] = roof_uv[1+2*j];
						r_obj->geo_tri.append(pt);
					}

				r_obj->geo_tri.get_minmax(r_obj->xyz_min,r_obj->xyz_max);

				// "IDX "
				int seq[6] = {0, 1, 2*quads, 1, 2*quads+1, 2*quads};
				for (int i = 0; i < 6*quads; ++i)
					r_obj->indices.push_back(2*(i/6)+seq[i%6]);

				// "ATTR_LOD"
				r_obj->lods.push_back(XObjLOD8());
				r_obj->lods.back().lod_near = 0;
				r_obj->lods.back().lod_far  = 1000;

				// "TRIS ";
				cmd.cmd = obj8_Tris;
				cmd.idx_offset = 0;
				cmd.idx_count  = r_obj->indices.size();
				r_obj->lods.back().cmds.push_back(cmd);

				info.previews.push_back(r_obj);
			}

			geometry = new THREE.BufferGeometry( );
			geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
			geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
			geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

			polygon = new THREE.Mesh( geometry, scope.roofMaterial );
			container.add( polygon );
*/
		}
	};

	return XPlaneFacLoader;

} )();
