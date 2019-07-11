/**
 * @author aussi / https://github.com/aussig
 * Heavily derived from OBJLoader @author mrdoob / http://mrdoob.com/
 */

THREE.XPlaneObjLoader = ( function () {

	function ParserState() {

		var state = {
			objects: [],
			object: {},

			vertices: [],
			normals: [],
			colors: [],
			uvs: [],
			indices: [],

			startObject: function ( name ) {

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( );

				}

				this.object = {
					name: name || '',

					geometry: {
						vertices: [],
						normals: [],
						colors: [],
						uvs: []
					},
					materials: [],
					smooth: true,

					startMaterial: function ( name ) {

						var material = {
							index: this.materials.length,
							name: name || '',
							smooth: this.smooth,
							groupStart: 0,
							groupEnd: -1,
							groupCount: -1,

							clone: function ( index ) {

								var cloned = {
									index: ( typeof index === 'number' ? index : this.index ),
									name: this.name,
									smooth: this.smooth,
									groupStart: 0,
									groupEnd: - 1,
									groupCount: - 1,
								};
								cloned.clone = this.clone.bind( cloned );
								return cloned;

							}
						};

						this.materials.push( material );

						return material;

					},

					currentMaterial: function () {

						if ( this.materials.length > 0 ) {

							return this.materials[ this.materials.length - 1 ];

						}

						return undefined;

					},

					_finalize: function ( ) {

						// Guarantee at least one empty material, this makes the creation later more straight forward.
						if ( this.materials.length === 0 ) {

							this.materials.push( {
								name: '',
								smooth: this.smooth
							} );

						}

					}
				};

				this.objects.push( this.object );

			},

			finalize: function () {

				if ( this.object && typeof this.object._finalize === 'function' ) {

					this.object._finalize( );

				}

			},

			parseVertexIndex: function ( value, len ) {

				return value * 3;

			},

			parseNormalIndex: function ( value, len ) {

				return value * 3;

			},

			parseUVIndex: function ( value, len ) {

				return value * 2;

			},

			addVertex: function ( a, b, c ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addVertexPoint: function ( a ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );

			},

			addVertexLine: function ( a ) {

				var src = this.vertices;
				var dst = this.object.geometry.vertices;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );

			},

			addNormal: function ( a, b, c ) {

				var src = this.normals;
				var dst = this.object.geometry.normals;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addColor: function ( a, b, c ) {

				var src = this.colors;
				var dst = this.object.geometry.colors;

				dst.push( src[ a + 0 ], src[ a + 1 ], src[ a + 2 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ], src[ b + 2 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ], src[ c + 2 ] );

			},

			addUV: function ( a, b, c ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );
				dst.push( src[ b + 0 ], src[ b + 1 ] );
				dst.push( src[ c + 0 ], src[ c + 1 ] );

			},

			addUVLine: function ( a ) {

				var src = this.uvs;
				var dst = this.object.geometry.uvs;

				dst.push( src[ a + 0 ], src[ a + 1 ] );

			},

			addFace: function ( a, b, c, ua, ub, uc, na, nb, nc ) {

				var vLen = this.vertices.length;

				var ia = this.parseVertexIndex( a, vLen );
				var ib = this.parseVertexIndex( b, vLen );
				var ic = this.parseVertexIndex( c, vLen );

				this.addVertex( ia, ib, ic );

				if ( ua !== undefined && ua !== '' ) {

					var uvLen = this.uvs.length;
					ia = this.parseUVIndex( ua, uvLen );
					ib = this.parseUVIndex( ub, uvLen );
					ic = this.parseUVIndex( uc, uvLen );
					this.addUV( ia, ib, ic );

				}

				if ( na !== undefined && na !== '' ) {

					// Normals are many times the same. If so, skip function call and parseInt.
					var nLen = this.normals.length;
					ia = this.parseNormalIndex( na, nLen );

					ib = na === nb ? ia : this.parseNormalIndex( nb, nLen );
					ic = na === nc ? ia : this.parseNormalIndex( nc, nLen );

					this.addNormal( ia, ib, ic );

				}

				if ( this.colors.length > 0 ) {

					this.addColor( ia, ib, ic );

				}

			},

			addPointGeometry: function ( vertices ) {

				this.object.geometry.type = 'Points';

				var vLen = this.vertices.length;

				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

					this.addVertexPoint( this.parseVertexIndex( vertices[ vi ], vLen ) );

				}

			},

			addLineGeometry: function ( vertices, uvs ) {

				this.object.geometry.type = 'Line';

				var vLen = this.vertices.length;
				var uvLen = this.uvs.length;

				for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

					this.addVertexLine( this.parseVertexIndex( vertices[ vi ], vLen ) );

				}

				for ( var uvi = 0, l = uvs.length; uvi < l; uvi ++ ) {

					this.addUVLine( this.parseUVIndex( uvs[ uvi ], uvLen ) );

				}

			}

		};

		state.startObject( '' );

		return state;

	}

	//

	function XPlaneObjLoader( manager ) {

		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

		this.materials = null;

	}

	XPlaneObjLoader.prototype = {

		constructor: XPlaneObjLoader,

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

		setMaterials: function ( materials ) {

			this.materials = materials;

			return this;

		},

		parse: function ( text ) {

			console.time( 'XPlaneObjLoader' );

			var state = new ParserState();

			if ( text.indexOf( '\r\n' ) !== - 1 ) {

				// This is faster than String.split with regex that splits on both
				text = text.replace( /\r\n/g, '\n' );

			}

			if ( text.indexOf( '\\\n' ) !== - 1 ) {

				// join lines separated by a line continuation character (\)
				text = text.replace( /\\\n/g, '' );

			}

			var lines = text.split( '\n' );
			var line = '', lineFirstChar = '';
			var lineLength = 0;

			// Faster to just trim left side of the line. Use if available.
			var trimLeft = ( typeof ''.trimLeft === 'function' );

			for ( var i = 0, l = lines.length; i < l; i++ ) {

				line = lines[ i ];
				line = trimLeft ? line.trimLeft() : line.trim();
				lineLength = line.length;

				if ( lineLength === 0 ) continue;

				// Ignore various unimportant lines
				if ( line.charAt( 0 ) === '#' || line === 'I' || line === 'A' || line === '800' || line === 'OBJ' ) continue;

				var data = line.split( /\s+/ );

				switch ( data[ 0 ] ) {

					case 'IDX10':
						for ( var j = 1; j < 11; j++ ) {

							state.indices.push( parseInt( data[ j ] ) );

						}

						break;

					case 'IDX':
						state.indices.push( parseInt( data[ 1 ] ) );
						break;

					case 'TEXTURE':
							break;

					case 'TEXTURE_LIT':
						break;

					case 'TRIS':
						// Build our face data from the number of tris specified
						var index = parseInt( data[ 1 ] );
						var count = parseInt( data[ 2 ] );

						for ( var j = index; j < index + count; j += 3 ) {

							// The vertex, uv and normal arrays are always perfectly aligned, so use same indices into each
							state.addFace(
								state.indices[ j ], state.indices[ j + 1 ], state.indices[ j + 2 ],
								state.indices[ j ], state.indices[ j + 1 ], state.indices[ j + 2 ],
								state.indices[ j ], state.indices[ j + 1 ], state.indices[ j + 2 ]
							);

						}

						break;

					case 'VT':
						state.vertices.push(
							parseFloat( data[ 1 ] ),
							parseFloat( data[ 2 ] ),
							parseFloat( data[ 3 ] )
						);
						state.normals.push(
							parseFloat( data[ 4 ] ),
							parseFloat( data[ 5 ] ),
							parseFloat( data[ 6 ] )
						);
						state.uvs.push(
							parseFloat( data[ 7 ] ),
							parseFloat( data[ 8 ] )
						);
						/*state.colors.push(
							Math.random(),
							Math.random(),
							Math.random()
						);*/
						break;

					case 'POINT_COUNTS':
						// Lines we are ignoring right now (some may be implemented later)
						break;

					default:

						// Handle null terminated files without exception
						if ( line === '\0' ) continue;

						throw new Error( 'THREE.XPlaneObjLoader: Unexpected line: "' + line + '"' );

				}

			}

			state.finalize();

			var container = new THREE.Group();

			for ( var i = 0, l = state.objects.length; i < l; i ++ ) {

				var object = state.objects[ i ];
				var geometry = object.geometry;
				var materials = object.materials;
				var isLine = ( geometry.type === 'Line' );
				var isPoints = ( geometry.type === 'Points' );
				var hasVertexColors = false;

				// Skip o/g line declarations that did not follow with any faces
				if ( geometry.vertices.length === 0 ) continue;

				var buffergeometry = new THREE.BufferGeometry();

				buffergeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( geometry.vertices, 3 ) );

				if ( geometry.normals.length > 0 ) {

					buffergeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( geometry.normals, 3 ) );

				} else {

					buffergeometry.computeVertexNormals();

				}

				if ( geometry.colors.length > 0 ) {

					hasVertexColors = true;
					buffergeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( geometry.colors, 3 ) );

				}

				if ( geometry.uvs.length > 0 ) {

					buffergeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( geometry.uvs, 2 ) );

				}

				// Create materials

				var createdMaterials = [];

				for ( var mi = 0, miLen = materials.length; mi < miLen; mi ++ ) {

					var sourceMaterial = materials[ mi ];
					var material = undefined;

					if ( this.materials !== null ) {

						material = this.materials.create( sourceMaterial.name );

						// mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.
						if ( isLine && material && ! ( material instanceof THREE.LineBasicMaterial ) ) {

							var materialLine = new THREE.LineBasicMaterial();
							THREE.Material.prototype.copy.call( materialLine, material );
							materialLine.color.copy( material.color );
							materialLine.lights = false;
							material = materialLine;

						} else if ( isPoints && material && ! ( material instanceof THREE.PointsMaterial ) ) {

							var materialPoints = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
							THREE.Material.prototype.copy.call( materialPoints, material );
							materialPoints.color.copy( material.color );
							materialPoints.map = material.map;
							materialPoints.lights = false;
							material = materialPoints;

						}

					}

					if ( ! material ) {

						if ( isLine ) {

							material = new THREE.LineBasicMaterial();

						} else if ( isPoints ) {

							material = new THREE.PointsMaterial( { size: 1, sizeAttenuation: false } );

						} else {

							material = new THREE.MeshPhongMaterial();

						}

						material.name = sourceMaterial.name;

					}

					material.flatShading = sourceMaterial.smooth ? false : true;
					material.vertexColors = hasVertexColors ? THREE.VertexColors : THREE.NoColors;

					createdMaterials.push( material );

				}

				// Create mesh

				var mesh;

				if ( createdMaterials.length > 1 ) {

					for ( var mi = 0, miLen = materials.length; mi < miLen; mi ++ ) {

						var sourceMaterial = materials[ mi ];
						buffergeometry.addGroup( sourceMaterial.groupStart, sourceMaterial.groupCount, mi );

					}

					if ( isLine ) {

						mesh = new THREE.LineSegments( buffergeometry, createdMaterials );

					} else if ( isPoints ) {

						mesh = new THREE.Points( buffergeometry, createdMaterials );

					} else {

						mesh = new THREE.Mesh( buffergeometry, createdMaterials );

					}

				} else {

					if ( isLine ) {

						mesh = new THREE.LineSegments( buffergeometry, createdMaterials[ 0 ] );

					} else if ( isPoints ) {

						mesh = new THREE.Points( buffergeometry, createdMaterials[ 0 ] );

					} else {

						mesh = new THREE.Mesh( buffergeometry, createdMaterials[ 0 ] );

					}

				}

				mesh.name = object.name;

				container.add( mesh );

			}

			console.timeEnd( 'XPlaneObjLoader' );

			return container;

		}

	};

	return XPlaneObjLoader;

} )();
