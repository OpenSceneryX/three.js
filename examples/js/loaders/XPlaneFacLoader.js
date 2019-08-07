/**
 * @author aussi / https://github.com/aussig
 * Heavily derived from OBJLoader @author mrdoob / http://mrdoob.com/
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

			// Create underlying surface to provide contrast for our lines
			var geometry = new THREE.BoxGeometry( 1.1, 0.01, 1.1 );
			var material = new THREE.MeshBasicMaterial( { color: 0x008000 } );
			var plane = new THREE.Mesh( geometry, material );
			container.add( plane );

			console.timeEnd( 'XPlaneFacLoader' );

			return container;

		},

		addTree: function ( container, treeData, index, spacingX, spacingZ, randomX, randomZ, scaleX, scaleY ) {
			// treeData: <s> <t> <w> <y> <offset> <frequency> <min height> <max height> <quads> <type>
			var treeH = treeData[6] + Math.random() * ( treeData[7] - treeData[6] );
			var treeW = treeH * treeData[2] / treeData[3];
			var treeX = ( index % treesPerRow ) * spacingX + randomX * ( 2.0 * Math.random() - 1.0 );
			var treeZ = ( index / treesPerRow ) * spacingZ + randomZ * ( 2.0 * Math.random() - 1.0 );
			var treeRotation = Math.random();

			var vertices = [];
			var normals = [];
			var uvs = [];

			var scope = this;

			for ( var i = 0; i < treeData[8]; i++ ) {
				var quadRotation = Math.PI * ( treeRotation + i / treeData[8] );        // tree rotation
				var quadX = treeW * Math.sin( quadRotation );
				var quadZ = treeW * Math.cos( quadRotation );

				// Tri 1, point 1
				vertices.push( treeX - quadX * ( treeData[4] / treeData[2] ), 0.0, treeZ - quadZ * ( treeData[4] / treeData[2] ) );
				normals.push( 0.0, 1.0, 0.0 );
				uvs.push( treeData[0] / scaleX, treeData[1] / scaleY );
				// Tri 1, point 2
				vertices.push( treeX + quadX * ( 1.0 - treeData[4] / treeData[2] ), 0.0, treeZ + quadZ * ( 1.0 - treeData[4] / treeData[2] ) );
				normals.push( 0.0, 1.0, 0.0 );
				uvs.push( ( treeData[0] + treeData[2] ) / scaleX, treeData[1] / scaleY );
				// Tri 1, point 3
				vertices.push( treeX + quadX * ( 1.0 - treeData[4] / treeData[2] ), treeH, treeZ + quadZ * ( 1.0 - treeData[4] / treeData[2] ) );
				normals.push( 0.0, 1.0, 0.0 );
				uvs.push( ( treeData[0] + treeData[2] ) / scaleX, ( treeData[1] + treeData[3] ) / scaleY );

				// Tri 2, point 1
				vertices.push( treeX - quadX * ( treeData[4] / treeData[2] ), 0.0, treeZ - quadZ * ( treeData[4] / treeData[2] ) );
				normals.push( 0.0, 1.0, 0.0 );
				uvs.push( treeData[0] / scaleX, treeData[1] / scaleY );
				// Tri 2, point 3
				vertices.push( treeX + quadX * ( 1.0 - treeData[4] / treeData[2] ), treeH, treeZ + quadZ * ( 1.0 - treeData[4] / treeData[2] ) );
				normals.push( 0.0, 1.0, 0.0 );
				uvs.push( ( treeData[0] + treeData[2] ) / scaleX, ( treeData[1] + treeData[3] ) / scaleY );
				// Tri 2, point 4
				vertices.push( treeX - quadX * (treeData[4] / treeData[2] ), treeH, treeZ - quadZ * ( treeData[4] / treeData[2] ) );
				normals.push( 0.0, 1.0, 0.0 );
				uvs.push( treeData[0] / scaleX, ( treeData[1] + treeData[3] ) / scaleY );
			}

			var geometry = new THREE.BufferGeometry( );
			geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
			geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
			geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

			var polygon = new THREE.Mesh( geometry, scope.roofMaterial );
			container.add( polygon );
		}

	};

	return XPlaneFacLoader;

} )();
