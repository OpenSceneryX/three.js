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
			/*ddsLoader.load(
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
				function ( err ) {*/
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
				/*}
			);*/

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
			/*ddsLoader.load(
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
				function ( err ) {*/
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
				/*}
			);*/

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

			var ring = true;
			var roof = false;
			var floorsMin = 1.0;
			var floorsMax = 9999.0;
			var roofSlope = 0.0;
			var roofHeight = 0.0;
			var scaleX = 20.0;
			var scaleY = 20.0;

			var walls = [];

			var roofUV = [ 0.0, 0.0, 1.0, 1.0 ];
			var texSizeX = 1024.0;
			var texSizeY = 1024.0;

			var roofSection = false;
			var noRoofMesh = false;

			for ( var i = 0, l = lines.length; i < l; i++ ) {

				line = lines[ i ];
				line = trimLeft ? line.trimLeft() : line.trim();

				// Ignore various unimportant lines
				if ( line.length === 0 ) continue;
				// Note that we fail on '1000' as we don't handle type 2 facades yet
				if ( line.charAt( 0 ) === '#' || line === 'I' || line === 'A' || line === '800' || line === 'FACADE' ) continue;

				var data = line.split( /\s+/ );

				switch ( data[ 0 ] ) {

					case 'RING':
						ring = parseInt(data[ 1 ]) > 0;
						break;

					case 'ROOF':
						roofSection = true;
						roof = true;
						break;

					case 'NO_ROOF_MESH':
						noRoofMesh = true;
						break;

					case 'ROOF_SCALE':
						roof = true;
						roofUV[0] = parseFloat(data[ 1 ]) / texSizeX;
						roofUV[1] = parseFloat(data[ 2 ]) / texSizeY;
						roofUV[2] = parseFloat(data[ 5 ]) / texSizeX;
						roofUV[3] = parseFloat(data[ 6 ]) / texSizeY;
						break;

					case 'FLOORS_MIN':
						floorsMin = parseFloat(data[ 1 ]);
						break;

					case 'FLOORS_MAX':
						floorsMax = parseFloat(data[ 1 ]);
						break;

					case 'ROOF_HEIGHT':
						roof = true;
						roofHeight = parseFloat(data[ 1 ]);
						break;

					case 'ROOF_SLOPE':
						roofSlope = parseFloat(data[ 1 ]);
						break;

					case 'SHADER_ROOF':
						roofSection = true;
						break;

					case 'SHADER_WALL':
						roofSection = false;
						break;

					case 'WALL':
						var wall = {
							vert: [0.0, 0.0, 0.0, 0.0],
							hori: [0.0, 0.0, 0.0, 0.0],
							minW: parseFloat(data[ 1 ]),
							maxW: parseFloat(data[ 2 ])
						}
						roofSection = false;
						walls.push( wall );
						break;

					case 'FLOOR':
						break;

					case 'TEXTURE':
						if (roofSection)
							this.loadRoofTexture( this.path + data[ 1 ] );
						else
							this.loadWallTexture( this.path + data[ 1 ] );
						break;

					case 'SCALE':
						scaleX = parseFloat(data[ 1 ]);
						scaleY = parseFloat(data[ 2 ]);
						break;

					case 'TEX_SIZE':
						texSizeX = parseFloat(data[ 1 ]);
						texSizeY = parseFloat(data[ 2 ]);
						break;

					case 'BOTTOM':
						var x = parseFloat(data[ 1 ]) / texSizeY;
						if (walls[walls.length - 1].vert[1] == 0.0) walls[walls.length - 1].vert[0] = x;
						walls[walls.length - 1].vert[1] = parseFloat(data[ 2 ]) / texSizeY;
						break;

					case 'MIDDLE':
						var x = parseFloat(data[ 1 ]) / texSizeY;
						walls[walls.length - 1].vert[2] = parseFloat(data[ 2 ]) / texSizeY;
						if ( walls[walls.length - 1].vert[1] == 0.0 ) {
							walls[walls.length - 1].vert[0] = x;
							walls[walls.length - 1].vert[1] = walls[walls.length - 1].vert[2];
						}
						break;

					case 'TOP':
						walls[walls.length - 1].vert[3] = parseFloat(data[ 2 ]) / texSizeY;
						break;

					case 'LEFT':
						var x = parseFloat(data[ 1 ]) / texSizeX;
						if ( walls[walls.length - 1].hori[1] == 0.0 ) walls[walls.length - 1].hori[0] = x;
						walls[walls.length - 1].hori[1] = parseFloat(data[ 2 ]) / texSizeX;
						break;

					case 'CENTER':
						var x = parseFloat(data[ 1 ]) / texSizeX;
						if ( walls[walls.length - 1].hori[1] == 0.0 ) {
							walls[walls.length - 1].hori[1] = x;
							walls[walls.length - 1].hori[0] = x;
						}
						walls[walls.length - 1].hori[2] = parseFloat(data[ 2 ]) / texSizeX;
						break;

					case 'RIGHT':
						walls[walls.length - 1].hori[3] = parseFloat(data[ 2 ]) / texSizeX;
						break;

					case 'LAYER_GROUP':
					case 'NO_BLEND':
					case 'TWO_SIDED':
					case 'LOD':
						// Lines we are ignoring right now (some may be implemented later)
						break;

					default:

						// Handle null terminated files without exception
						if ( line === '\0' ) continue;

						throw new Error( 'THREE.XPlaneFacLoader: Unexpected line: "' + line + '"' );

				}

			}

			var container = new THREE.Group();

			// Add facade
			this.addFacade( container, walls, roofUV, scaleX, scaleY, floorsMin, floorsMax, ring, roof );

			console.timeEnd( 'XPlaneFacLoader' );

			return container;

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

			var scope = this;

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
					x = z = 0.0;

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

			var polygon = new THREE.Mesh( geometry, scope.wallMaterial );
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
