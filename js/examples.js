const usingCovariantCurvature =
{
  "last_node_id": 6,
  "last_link_id": 22,
  "nodes": [
    {
      "id": 5,
      "type": "Output/Generate Terrain",
      "pos": {
        "0": 832,
        "1": 231,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": [
        220,
        130
      ],
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {
          "name": "heightmap",
          "type": "array",
          "link": 12
        }
      ],
      "outputs": [],
      "title": "Generate Terrain",
      "properties": {
        "water": true
      }
    },
    {
      "id": 3,
      "type": "Filter/Thermal Erosion",
      "pos": {
        "0": 568,
        "1": 211,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 22
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            12
          ],
          "slot_index": 0
        }
      ],
      "title": "Thermal Erosion",
      "properties": {
        "iterations": 36.13888702392578,
        "rate": 0.5
      }
    },
    {
      "id": 6,
      "type": "Combine/Covariant Curvature",
      "pos": {
        "0": 363,
        "1": 202,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        {
          "name": "Base (P)",
          "type": "array",
          "link": 19
        },
        {
          "name": "Wave (ψ)",
          "type": "array",
          "link": 20
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            22
          ],
          "slot_index": 0
        }
      ],
      "title": "Covariant Curvature",
      "properties": {}
    },
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": {
        "0": 80,
        "1": 48,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            19
          ],
          "slot_index": 0
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 16.654320610894096,
        "octaves": 5.58456776936849,
        "amplitude": 1.9969134860568576,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 2,
      "type": "Generator/Wave Interference",
      "pos": {
        "0": 82,
        "1": 399,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            13,
            20
          ],
          "slot_index": 0
        }
      ],
      "title": "Wave Interference",
      "properties": {
        "frequency": 3.6083029922485346,
        "sources": 16.82530805799696,
        "phase": 3.4867880297851563,
        "decay": 0,
        "seed": 1
      }
    }
  ],
  "links": [
    [
      12,
      3,
      0,
      5,
      0,
      "array"
    ],
    [
      13,
      2,
      0,
      4,
      1,
      "array"
    ],
    [
      19,
      1,
      0,
      6,
      0,
      "array"
    ],
    [
      20,
      2,
      0,
      6,
      1,
      "array"
    ],
    [
      22,
      6,
      0,
      3,
      0,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
}
const exampleEye = {
  "last_node_id": 32,
  "last_link_id": 44,
  "nodes": [
    {
      "id": 1,
      "type": "Generator/Stripes",
      "pos": {
        "0": -85,
        "1": -137,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            2
          ],
          "slot_index": 0
        }
      ],
      "title": "Stripes",
      "properties": {
        "frequency": 1,
        "width": 0.47935830150604253,
        "softness": 0.20018383368136958,
        "vertical": false
      }
    },
    {
      "id": 17,
      "type": "Generator/Circle",
      "pos": {
        "0": 1414.725830078125,
        "1": 397.7767639160156,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            27
          ],
          "slot_index": 0
        }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.1331111679077152,
        "x": 0.5020593200067057,
        "y": 0.5035214973218507
      }
    },
    {
      "id": 4,
      "type": "Generator/DirectionalNoise",
      "pos": {
        "0": -187,
        "1": 219,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            20
          ],
          "slot_index": 0
        }
      ],
      "title": "DirectionalNoise",
      "properties": {
        "frequency": 5,
        "stretch": 20,
        "amplitude": 1,
        "angle": 0,
        "seed": 1,
        "offset": 0
      }
    },
    {
      "id": 6,
      "type": "Math/Multiply",
      "pos": {
        "0": 612,
        "1": 43,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 10,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 21
        },
        {
          "name": "B",
          "type": "array",
          "link": 20
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            10
          ],
          "slot_index": 0
        }
      ],
      "title": "Multiply",
      "properties": {}
    },
    {
      "id": 22,
      "type": "Filter/Blur",
      "pos": {
        "0": 1941,
        "1": 401,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 8,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 31
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            42
          ],
          "slot_index": 0
        }
      ],
      "title": "Blur",
      "properties": {
        "amount": 2.3033446762235146,
        "passes": 3.7977660642078463
      }
    },
    {
      "id": 20,
      "type": "Generator/Circle",
      "pos": {
        "0": 1697,
        "1": 403,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            31
          ],
          "slot_index": 0
        }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.06765572203749141,
        "x": 0.2822352273624018,
        "y": 0.6752947489420573
      }
    },
    {
      "id": 18,
      "type": "Math/Subtract",
      "pos": {
        "0": 1788,
        "1": 82,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 16,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 44
        },
        {
          "name": "B",
          "type": "array",
          "link": 27
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            29
          ],
          "slot_index": 0
        }
      ],
      "title": "Subtract",
      "properties": {}
    },
    {
      "id": 32,
      "type": "Math/Saturate",
      "pos": {
        "0": 1573,
        "1": 84,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 164
      },
      "flags": {},
      "order": 15,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 43
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            44
          ],
          "slot_index": 0
        }
      ],
      "title": "Saturate",
      "properties": {}
    },
    {
      "id": 16,
      "type": "Combine/Mix",
      "pos": {
        "0": 1313,
        "1": 77,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 14,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 24
        },
        {
          "name": "B",
          "type": "array",
          "link": 25
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            43
          ],
          "slot_index": 0
        }
      ],
      "title": "Mix / Lerp",
      "properties": {
        "t": 0.27350967887030797
      }
    },
    {
      "id": 7,
      "type": "Generator/Circle",
      "pos": {
        "0": 1085,
        "1": 377,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            25
          ],
          "slot_index": 0
        }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.43443465993453667,
        "x": 0.5030617607964409,
        "y": 0.5030617607964409
      }
    },
    {
      "id": 19,
      "type": "Generator/DirectionalNoise",
      "pos": {
        "0": -185,
        "1": 611,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            28
          ],
          "slot_index": 0
        }
      ],
      "title": "DirectionalNoise",
      "properties": {
        "frequency": 3.690498513185781,
        "stretch": 32.70483232658882,
        "amplitude": 2.318582322862413,
        "angle": 0,
        "seed": 1,
        "offset": 1.5854906795000703
      }
    },
    {
      "id": 13,
      "type": "Transform/Cartesian to Polar",
      "pos": {
        "0": 762,
        "1": 333,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 11,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 19
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            23
          ],
          "slot_index": 0
        }
      ],
      "title": "Cartesian to Polar",
      "properties": {
        "scale": 0.8115443188137488
      }
    },
    {
      "id": 2,
      "type": "Transform/Cartesian to Polar",
      "pos": {
        "0": 820,
        "1": 40,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 12,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 10
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            22
          ],
          "slot_index": 0
        }
      ],
      "title": "Cartesian to Polar",
      "properties": {
        "scale": 1.0791793418128985
      }
    },
    {
      "id": 3,
      "type": "Transform/Offset",
      "pos": {
        "0": 185,
        "1": -134,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 7,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 2
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            21
          ],
          "slot_index": 0
        }
      ],
      "title": "Offset",
      "properties": {
        "offsetX": 0,
        "offsetY": -0.1368718087090378
      }
    },
    {
      "id": 12,
      "type": "Generator/Stripes",
      "pos": {
        "0": 110,
        "1": 690,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            18
          ],
          "slot_index": 0
        }
      ],
      "title": "Stripes",
      "properties": {
        "frequency": 1,
        "width": 0.6952134704589835,
        "softness": 0.20874301244784646,
        "vertical": false
      }
    },
    {
      "id": 14,
      "type": "Math/Multiply",
      "pos": {
        "0": 456,
        "1": 569,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 9,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 28
        },
        {
          "name": "B",
          "type": "array",
          "link": 18
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            19
          ],
          "slot_index": 0
        }
      ],
      "title": "Multiply",
      "properties": {}
    },
    {
      "id": 15,
      "type": "Math/Add",
      "pos": {
        "0": 1108,
        "1": 79,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 13,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 22
        },
        {
          "name": "B",
          "type": "array",
          "link": 23
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            24
          ],
          "slot_index": 0
        }
      ],
      "title": "Add",
      "properties": {}
    },
    {
      "id": 21,
      "type": "Math/Add",
      "pos": {
        "0": 2233,
        "1": 82,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 17,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 29
        },
        {
          "name": "B",
          "type": "array",
          "link": 42
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [],
          "slot_index": 0
        }
      ],
      "title": "Add",
      "properties": {},
      "color": "#223",
      "bgcolor": "#335"
    }
  ],
  "links": [
    [
      2,
      1,
      0,
      3,
      0,
      "array"
    ],
    [
      10,
      6,
      0,
      2,
      0,
      "array"
    ],
    [
      18,
      12,
      0,
      14,
      1,
      "array"
    ],
    [
      19,
      14,
      0,
      13,
      0,
      "array"
    ],
    [
      20,
      4,
      0,
      6,
      1,
      "array"
    ],
    [
      21,
      3,
      0,
      6,
      0,
      "array"
    ],
    [
      22,
      2,
      0,
      15,
      0,
      "array"
    ],
    [
      23,
      13,
      0,
      15,
      1,
      "array"
    ],
    [
      24,
      15,
      0,
      16,
      0,
      "array"
    ],
    [
      25,
      7,
      0,
      16,
      1,
      "array"
    ],
    [
      27,
      17,
      0,
      18,
      1,
      "array"
    ],
    [
      28,
      19,
      0,
      14,
      0,
      "array"
    ],
    [
      29,
      18,
      0,
      21,
      0,
      "array"
    ],
    [
      31,
      20,
      0,
      22,
      0,
      "array"
    ],
    [
      42,
      22,
      0,
      21,
      1,
      "array"
    ],
    [
      43,
      16,
      0,
      32,
      0,
      "array"
    ],
    [
      44,
      32,
      0,
      18,
      0,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

const examplePixelRock = {
  "last_node_id": 50,
  "last_link_id": 81,
  "nodes": [
    {
      "id": 2,
      "type": "Generator/Checkerboard",
      "pos": {
        "0": 216,
        "1": 497,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [],
          "slot_index": 0
        }
      ],
      "title": "Checkerboard",
      "properties": {
        "size": 32
      }
    },
    {
      "id": 7,
      "type": "Filter/Sobel",
      "pos": {
        "0": 761.8717651367188,
        "1": 793.6240234375,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 164
      },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 11
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            8
          ],
          "slot_index": 0
        }
      ],
      "title": "Sobel Edge",
      "properties": {}
    },
    {
      "id": 10,
      "type": "Filter/Threshold",
      "pos": {
        "0": 955.8717651367188,
        "1": 728.6240234375,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 7,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 8
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            13
          ],
          "slot_index": 0
        }
      ],
      "title": "Threshold / Mask",
      "properties": {
        "threshold": 0.003842396381696744,
        "soft": 0.001921198190848372
      }
    },
    {
      "id": 6,
      "type": "Filter/Pixelate",
      "pos": {
        "0": 508,
        "1": 383,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 4
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            11,
            12
          ],
          "slot_index": 0
        }
      ],
      "title": "Pixelate",
      "properties": {
        "pixelSize": 32
      }
    },
    {
      "id": 45,
      "type": "Filter/Pixelate",
      "pos": {
        "0": 3019.52685546875,
        "1": 735.0768432617188,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 17,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 71
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            72
          ],
          "slot_index": 0
        }
      ],
      "title": "Pixelate",
      "properties": {
        "pixelSize": 32
      }
    },
    {
      "id": 42,
      "type": "Filter/Pixelate",
      "pos": {
        "0": 1693.8717041015625,
        "1": 725.6240234375,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 10,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 64
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            65,
            76
          ],
          "slot_index": 0
        }
      ],
      "title": "Pixelate",
      "properties": {
        "pixelSize": 32
      }
    },
    {
      "id": 29,
      "type": "Filter/Blur",
      "pos": {
        "0": 2524.52685546875,
        "1": 736.0768432617188,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 15,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 34
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            35
          ],
          "slot_index": 0
        }
      ],
      "title": "Blur",
      "properties": {
        "amount": 6.174980468750004,
        "passes": 3.2999913194444463
      }
    },
    {
      "id": 39,
      "type": "Filter/Threshold",
      "pos": {
        "0": 3256.52685546875,
        "1": 735.0768432617188,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 18,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 72
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            60
          ],
          "slot_index": 0
        }
      ],
      "title": "Threshold / Mask",
      "properties": {
        "threshold": 0.8703153359769532,
        "soft": 0
      }
    },
    {
      "id": 1,
      "type": "Generator/Voronoi",
      "pos": {
        "0": 229,
        "1": 118,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            4
          ],
          "slot_index": 0
        }
      ],
      "title": "Voronoi",
      "properties": {
        "scale": 40.12832397460916,
        "seed": 466.06196729254026,
        "type": "FlatCell"
      }
    },
    {
      "id": 11,
      "type": "Math/Subtract",
      "pos": {
        "0": 2007,
        "1": 410,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 11,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 12
        },
        {
          "name": "B",
          "type": "array",
          "link": 65
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            39,
            55
          ],
          "slot_index": 0
        }
      ],
      "title": "Subtract",
      "properties": {}
    },
    {
      "id": 50,
      "type": "Math/Invert",
      "pos": {
        "0": 2011,
        "1": 721,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 164
      },
      "flags": {},
      "order": 12,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 76
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            77
          ],
          "slot_index": 0
        }
      ],
      "title": "Invert",
      "properties": {}
    },
    {
      "id": 28,
      "type": "Filter/Threshold",
      "pos": {
        "0": 2776,
        "1": 736,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 16,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 35
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            71
          ],
          "slot_index": 0
        }
      ],
      "title": "Threshold / Mask",
      "properties": {
        "threshold": 0.6601432919392766,
        "soft": 0.36027669270833435
      }
    },
    {
      "id": 47,
      "type": "Generator/Ridged Noise",
      "pos": {
        "0": 2672,
        "1": -183,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            73
          ],
          "slot_index": 0
        }
      ],
      "title": "Ridged Noise",
      "properties": {
        "scale": 17.01031222873264,
        "octaves": 4,
        "seed": 1
      }
    },
    {
      "id": 48,
      "type": "Filter/Pixelate",
      "pos": {
        "0": 2920,
        "1": -172,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 73
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            74
          ],
          "slot_index": 0
        }
      ],
      "title": "Pixelate",
      "properties": {
        "pixelSize": 32
      }
    },
    {
      "id": 49,
      "type": "Filter/Threshold",
      "pos": {
        "0": 3167,
        "1": -174,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 74
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            75
          ],
          "slot_index": 0
        }
      ],
      "title": "Threshold / Mask",
      "properties": {
        "threshold": 1,
        "soft": 0
      }
    },
    {
      "id": 32,
      "type": "Math/Subtract",
      "pos": {
        "0": 3498,
        "1": 161,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 19,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 56
        },
        {
          "name": "B",
          "type": "array",
          "link": 60
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            46
          ],
          "slot_index": 0
        }
      ],
      "title": "Subtract",
      "properties": {}
    },
    {
      "id": 33,
      "type": "Combine/Mask Blend",
      "pos": {
        "0": 3709,
        "1": 10,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 204
      },
      "flags": {},
      "order": 20,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 75
        },
        {
          "name": "B",
          "type": "array",
          "link": null
        },
        {
          "name": "Mask",
          "type": "array",
          "link": 46
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            50
          ],
          "slot_index": 0
        }
      ],
      "title": "Mask Blend",
      "properties": {}
    },
    {
      "id": 35,
      "type": "Math/Saturate",
      "pos": {
        "0": 3892,
        "1": 16,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 164
      },
      "flags": {},
      "order": 21,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 50
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            61
          ],
          "slot_index": 0
        }
      ],
      "title": "Saturate",
      "properties": {}
    },
    {
      "id": 27,
      "type": "Filter/Threshold",
      "pos": {
        "0": 2284.52685546875,
        "1": 737.0768432617188,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 14,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 77
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            34
          ],
          "slot_index": 0
        }
      ],
      "title": "Threshold / Mask",
      "properties": {
        "threshold": 0.6076585015190984,
        "soft": 0.1994433593749995
      }
    },
    {
      "id": 37,
      "type": "Filter/Threshold",
      "pos": {
        "0": 2856,
        "1": 165,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 13,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 55
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            56
          ],
          "slot_index": 0
        }
      ],
      "title": "Threshold / Mask",
      "properties": {
        "threshold": 0.6646482789789692,
        "soft": 0.3488752402983285
      }
    },
    {
      "id": 12,
      "type": "Filter/Blur",
      "pos": {
        "0": 1206,
        "1": 729,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 8,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 13
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            14
          ],
          "slot_index": 0
        }
      ],
      "title": "Blur",
      "properties": {
        "amount": 4.253079752061171,
        "passes": 1.328268876769203
      }
    },
    {
      "id": 13,
      "type": "Filter/Threshold",
      "pos": {
        "0": 1446,
        "1": 727,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 9,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 14
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            64
          ],
          "slot_index": 0
        }
      ],
      "title": "Threshold / Mask",
      "properties": {
        "threshold": 0.07098029464078132,
        "soft": 0.001921198190848372
      }
    },
    {
      "id": 26,
      "type": "Math/Subtract",
      "pos": {
        "0": 4064,
        "1": 404,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 22,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 39
        },
        {
          "name": "B",
          "type": "array",
          "link": 61
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": null
        }
      ],
      "title": "Subtract",
      "properties": {}
    }
  ],
  "links": [
    [
      4,
      1,
      0,
      6,
      0,
      "array"
    ],
    [
      8,
      7,
      0,
      10,
      0,
      "array"
    ],
    [
      11,
      6,
      0,
      7,
      0,
      "array"
    ],
    [
      12,
      6,
      0,
      11,
      0,
      "array"
    ],
    [
      13,
      10,
      0,
      12,
      0,
      "array"
    ],
    [
      14,
      12,
      0,
      13,
      0,
      "array"
    ],
    [
      34,
      27,
      0,
      29,
      0,
      "array"
    ],
    [
      35,
      29,
      0,
      28,
      0,
      "array"
    ],
    [
      39,
      11,
      0,
      26,
      0,
      "array"
    ],
    [
      46,
      32,
      0,
      33,
      2,
      "array"
    ],
    [
      50,
      33,
      0,
      35,
      0,
      "array"
    ],
    [
      55,
      11,
      0,
      37,
      0,
      "array"
    ],
    [
      56,
      37,
      0,
      32,
      0,
      "array"
    ],
    [
      60,
      39,
      0,
      32,
      1,
      "array"
    ],
    [
      61,
      35,
      0,
      26,
      1,
      "array"
    ],
    [
      64,
      13,
      0,
      42,
      0,
      "array"
    ],
    [
      65,
      42,
      0,
      11,
      1,
      "array"
    ],
    [
      71,
      28,
      0,
      45,
      0,
      "array"
    ],
    [
      72,
      45,
      0,
      39,
      0,
      "array"
    ],
    [
      73,
      47,
      0,
      48,
      0,
      "array"
    ],
    [
      74,
      48,
      0,
      49,
      0,
      "array"
    ],
    [
      75,
      49,
      0,
      33,
      0,
      "array"
    ],
    [
      76,
      42,
      0,
      50,
      0,
      "array"
    ],
    [
      77,
      50,
      0,
      27,
      0,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
}

const exampleIsland = {
  "last_node_id": 13,
  "last_link_id": 19,
  "nodes": [
    {
      "id": 7,
      "type": "Expression/Formula1",
      "pos": {
        "0": 270,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 5
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            6
          ]
        }
      ],
      "title": "Formula1",
      "properties": {
        "formula": "-a"
      }
    },
    {
      "id": 6,
      "type": "Generator/FormulaXY",
      "pos": {
        "0": 10,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            5
          ]
        }
      ],
      "properties": {
        "formula": "sqrt(pow(x - 0.5, 2.0) + pow(y - 0.5, 2.0)) - 0.3"
      }
    },
    {
      "id": 8,
      "type": "Math/Scale",
      "pos": {
        "0": 530,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 6
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            7
          ]
        }
      ],
      "title": "Scale",
      "properties": {
        "amount": 10
      }
    },
    {
      "id": 5,
      "type": "Math/Add",
      "pos": {
        "0": 829,
        "1": 378,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 8,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 16
        },
        {
          "name": "B",
          "type": "array",
          "link": 15
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            14
          ],
          "slot_index": 0
        }
      ],
      "title": "Add",
      "properties": {}
    },
    {
      "id": 3,
      "type": "Math/Scale",
      "pos": {
        "0": 253,
        "1": 121,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 1
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            2
          ]
        }
      ],
      "title": "Scale",
      "properties": {
        "amount": 0.7699361165364405
      }
    },
    {
      "id": 2,
      "type": "Generator/Perlin",
      "pos": {
        "0": -2,
        "1": 108,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            1
          ]
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 2.086527065700955,
        "octaves": 1.178776951599124,
        "amplitude": 2.7896978225708025,
        "offset": 3.1594200447930265,
        "seed": 491.89817494964643
      }
    },
    {
      "id": 9,
      "type": "Math/Clamp",
      "pos": {
        "0": 790,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 7,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 7
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            13
          ]
        }
      ],
      "title": "Clamp",
      "properties": {
        "min": -5,
        "max": 0.18666508992513098
      }
    },
    {
      "id": 4,
      "type": "Math/Clamp",
      "pos": {
        "0": 514,
        "1": 116,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 2
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            16
          ],
          "slot_index": 0
        }
      ],
      "title": "Clamp",
      "properties": {
        "min": -3.787254163954003,
        "max": 0.06837153116862282
      }
    },
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": {
        "0": 251,
        "1": 375,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            15
          ],
          "slot_index": 0
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 6.2,
        "octaves": 6.536795616149902,
        "amplitude": 4.426665327284072,
        "offset": 3.346721437242296,
        "seed": 367.4671871444707
      }
    },
    {
      "id": 10,
      "type": "Math/Add",
      "pos": {
        "0": 1116,
        "1": 412,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 9,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 14
        },
        {
          "name": "B",
          "type": "array",
          "link": 13
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [],
          "slot_index": 0
        }
      ],
      "title": "Add",
      "properties": {}
    }
  ],
  "links": [
    [
      1,
      2,
      0,
      3,
      0,
      "array"
    ],
    [
      2,
      3,
      0,
      4,
      0,
      "array"
    ],
    [
      5,
      6,
      0,
      7,
      0,
      "array"
    ],
    [
      6,
      7,
      0,
      8,
      0,
      "array"
    ],
    [
      7,
      8,
      0,
      9,
      0,
      "array"
    ],
    [
      13,
      9,
      0,
      10,
      1,
      "array"
    ],
    [
      14,
      5,
      0,
      10,
      0,
      "array"
    ],
    [
      15,
      1,
      0,
      5,
      1,
      "array"
    ],
    [
      16,
      4,
      0,
      5,
      0,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

const exampleWoodPlank = {
  "last_node_id": 27,
  "last_link_id": 32,
  "nodes": [
    {
      "id": 13,
      "type": "Transform/Warp",
      "pos": {
        "0": 836,
        "1": 771,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 3
        },
        {
          "name": "warp",
          "type": "array",
          "link": 4
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            5
          ],
          "slot_index": 0
        }
      ],
      "title": "Warp",
      "properties": {
        "intensity": 27.03618898741916
      }
    },
    {
      "id": 12,
      "type": "Generator/Perlin",
      "pos": {
        "0": 581,
        "1": 775,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            3,
            4
          ],
          "slot_index": 0
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 13.217531564229805,
        "octaves": 1.175673640137713,
        "amplitude": 1,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 15,
      "type": "Generator/DirectionalNoise",
      "pos": {
        "0": 727.2774047851562,
        "1": -292.4010314941406,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            6
          ],
          "slot_index": 0
        }
      ],
      "title": "DirectionalNoise",
      "properties": {
        "frequency": 5,
        "stretch": 24.158060747386052,
        "amplitude": 0.9359435881142859,
        "angle": 90.97466284381426,
        "seed": 253.45468939158457
      }
    },
    {
      "id": 16,
      "type": "Transform/Warp",
      "pos": {
        "0": 1101,
        "1": -27,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 8,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 6
        },
        {
          "name": "warp",
          "type": "array",
          "link": 7
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            31
          ],
          "slot_index": 0
        }
      ],
      "title": "Warp",
      "properties": {
        "intensity": 21.89274058115043
      }
    },
    {
      "id": 23,
      "type": "Generator/Stripes",
      "pos": {
        "0": 1284,
        "1": -799,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            20
          ],
          "slot_index": 0
        }
      ],
      "title": "Stripes",
      "properties": {
        "frequency": 9.120041128187692,
        "width": 0.9199560852050777,
        "softness": 0.4397320929607771,
        "vertical": false
      }
    },
    {
      "id": 24,
      "type": "Transform/Warp",
      "pos": {
        "0": 1683,
        "1": -597,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 7,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 20
        },
        {
          "name": "warp",
          "type": "array",
          "link": 21
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            24
          ],
          "slot_index": 0
        }
      ],
      "title": "Warp",
      "properties": {
        "intensity": 44.648515771900875
      }
    },
    {
      "id": 27,
      "type": "Math/Normalize",
      "pos": {
        "0": 1945,
        "1": -596,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 164
      },
      "flags": {},
      "order": 10,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 24
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            26
          ],
          "slot_index": 0
        }
      ],
      "title": "Normalize",
      "properties": {}
    },
    {
      "id": 17,
      "type": "Math/Normalize",
      "pos": {
        "0": 2635,
        "1": 4,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 164
      },
      "flags": {},
      "order": 12,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 32
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            16
          ],
          "slot_index": 0
        }
      ],
      "title": "Normalize",
      "properties": {}
    },
    {
      "id": 25,
      "type": "Generator/Perlin",
      "pos": {
        "0": 1285,
        "1": -477,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            21
          ],
          "slot_index": 0
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 17.57773939680894,
        "octaves": 2.4368399527339495,
        "amplitude": 4.337894641601647,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 26,
      "type": "Transform/Warp",
      "pos": {
        "0": 2267,
        "1": -204,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 11,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 31
        },
        {
          "name": "warp",
          "type": "array",
          "link": 26
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            32
          ],
          "slot_index": 0
        }
      ],
      "title": "Warp",
      "properties": {
        "intensity": 21.37404650643172
      }
    },
    {
      "id": 14,
      "type": "Generator/Perlin",
      "pos": {
        "0": 724,
        "1": 44,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            7
          ],
          "slot_index": 0
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 9.229122277462112,
        "octaves": 2.602120211379937,
        "amplitude": 1.1527245326075217,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 11,
      "type": "Transform/Warp",
      "pos": {
        "0": 1104,
        "1": 451,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 9,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 2
        },
        {
          "name": "warp",
          "type": "array",
          "link": 5
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            17,
            19
          ],
          "slot_index": 0
        }
      ],
      "title": "Warp",
      "properties": {
        "intensity": 2.7568775282926103
      }
    },
    {
      "id": 21,
      "type": "Combine/Mix",
      "pos": {
        "0": 2917,
        "1": 146,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 13,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 16
        },
        {
          "name": "B",
          "type": "array",
          "link": 17
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            18
          ],
          "slot_index": 0
        }
      ],
      "title": "Mix / Lerp",
      "properties": {
        "t": 0.5062448374858048
      }
    },
    {
      "id": 10,
      "type": "Generator/Bricks",
      "pos": {
        "0": 620,
        "1": 457,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            2
          ],
          "slot_index": 0
        }
      ],
      "title": "Bricks",
      "properties": {
        "bricksX": 1,
        "bricksY": 10.380999888494319,
        "mortar": 2.6969534808446145,
        "bevel": 0
      }
    },
    {
      "id": 22,
      "type": "Math/Min",
      "pos": {
        "0": 3276,
        "1": 397,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 14,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 18
        },
        {
          "name": "B",
          "type": "array",
          "link": 19
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": null
        }
      ],
      "title": "Min",
      "properties": {}
    }
  ],
  "links": [
    [
      2,
      10,
      0,
      11,
      0,
      "array"
    ],
    [
      3,
      12,
      0,
      13,
      0,
      "array"
    ],
    [
      4,
      12,
      0,
      13,
      1,
      "array"
    ],
    [
      5,
      13,
      0,
      11,
      1,
      "array"
    ],
    [
      6,
      15,
      0,
      16,
      0,
      "array"
    ],
    [
      7,
      14,
      0,
      16,
      1,
      "array"
    ],
    [
      16,
      17,
      0,
      21,
      0,
      "array"
    ],
    [
      17,
      11,
      0,
      21,
      1,
      "array"
    ],
    [
      18,
      21,
      0,
      22,
      0,
      "array"
    ],
    [
      19,
      11,
      0,
      22,
      1,
      "array"
    ],
    [
      20,
      23,
      0,
      24,
      0,
      "array"
    ],
    [
      21,
      25,
      0,
      24,
      1,
      "array"
    ],
    [
      24,
      24,
      0,
      27,
      0,
      "array"
    ],
    [
      26,
      27,
      0,
      26,
      1,
      "array"
    ],
    [
      31,
      16,
      0,
      26,
      0,
      "array"
    ],
    [
      32,
      26,
      0,
      17,
      0,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

// ─────────────────────────────────────────────────────────────────────────────
// Experiment Pipeline Graphs (A–E)
// Matches the exact parameters from run_experiment.py / server/core/experiment.py
//   Phase I  freq=5.0, octaves=6 (A: octaves=1), persistence=0.5, lacunarity=2.0
//   Phase II wave_count=8, wave_intensity=0.3 → WaveInterference sources=8, freq=2.0
//   Phase IV erosion_iterations=10, thermal_rate=0.5
// ─────────────────────────────────────────────────────────────────────────────

// Pipeline A — Raw Noise Baseline
// Perlin (octaves=1, freq=5) → Generate Terrain
const experimentPipelineA = {
  "last_node_id": 2,
  "last_link_id": 1,
  "nodes": [
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": { "0": 80, "1": 150 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "noise", "type": "array", "links": [1], "slot_index": 0 }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 5,
        "octaves": 1,
        "amplitude": 1,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 2,
      "type": "Output/Generate Terrain",
      "pos": { "0": 360, "1": 200 },
      "size": [220, 130],
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [
        { "name": "heightmap", "type": "array", "link": 1 }
      ],
      "outputs": [],
      "title": "Generate Terrain",
      "properties": { "water": true }
    }
  ],
  "links": [
    [1, 1, 0, 2, 0, "array"]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

// Pipeline B — fBm Baseline
// Perlin (octaves=6, freq=5) → Generate Terrain
const experimentPipelineB = {
  "last_node_id": 2,
  "last_link_id": 1,
  "nodes": [
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": { "0": 80, "1": 150 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "noise", "type": "array", "links": [1], "slot_index": 0 }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 5,
        "octaves": 6,
        "amplitude": 1,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 2,
      "type": "Output/Generate Terrain",
      "pos": { "0": 360, "1": 200 },
      "size": [220, 130],
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [
        { "name": "heightmap", "type": "array", "link": 1 }
      ],
      "outputs": [],
      "title": "Generate Terrain",
      "properties": { "water": true }
    }
  ],
  "links": [
    [1, 1, 0, 2, 0, "array"]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

// Pipeline C — fBm + Thermal Erosion
// Perlin (octaves=6, freq=5) → Thermal Erosion (iter=10, rate=0.5) → Generate Terrain
const experimentPipelineC = {
  "last_node_id": 3,
  "last_link_id": 2,
  "nodes": [
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": { "0": 80, "1": 150 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "noise", "type": "array", "links": [1], "slot_index": 0 }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 5,
        "octaves": 6,
        "amplitude": 1,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 2,
      "type": "Filter/Thermal Erosion",
      "pos": { "0": 360, "1": 150 },
      "size": { "0": 210, "1": 220 },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [
        { "name": "value", "type": "array", "link": 1 }
      ],
      "outputs": [
        { "name": "out", "type": "array", "links": [2], "slot_index": 0 }
      ],
      "title": "Thermal Erosion",
      "properties": {
        "iterations": 10,
        "rate": 0.5
      }
    },
    {
      "id": 3,
      "type": "Output/Generate Terrain",
      "pos": { "0": 640, "1": 180 },
      "size": [220, 130],
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        { "name": "heightmap", "type": "array", "link": 2 }
      ],
      "outputs": [],
      "title": "Generate Terrain",
      "properties": { "water": true }
    }
  ],
  "links": [
    [1, 1, 0, 2, 0, "array"],
    [2, 2, 0, 3, 0, "array"]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

// Pipeline D — Wave-Harmonic (no erosion)
// Perlin (octaves=6, freq=5) + Wave Interference (sources=8, freq=2) → Covariant Curvature → Generate Terrain
const experimentPipelineD = {
  "last_node_id": 4,
  "last_link_id": 4,
  "nodes": [
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": { "0": 80, "1": 50 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "noise", "type": "array", "links": [1], "slot_index": 0 }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 5,
        "octaves": 6,
        "amplitude": 1,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 2,
      "type": "Generator/Wave Interference",
      "pos": { "0": 80, "1": 410 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "out", "type": "array", "links": [2], "slot_index": 0 }
      ],
      "title": "Wave Interference",
      "properties": {
        "frequency": 2,
        "sources": 8,
        "phase": 0,
        "decay": 0,
        "seed": 1
      }
    },
    {
      "id": 3,
      "type": "Combine/Covariant Curvature",
      "pos": { "0": 370, "1": 220 },
      "size": { "0": 140, "1": 184 },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        { "name": "Base (P)", "type": "array", "link": 1 },
        { "name": "Wave (ψ)", "type": "array", "link": 2 }
      ],
      "outputs": [
        { "name": "out", "type": "array", "links": [3], "slot_index": 0 }
      ],
      "title": "Covariant Curvature",
      "properties": {}
    },
    {
      "id": 4,
      "type": "Output/Generate Terrain",
      "pos": { "0": 580, "1": 245 },
      "size": [220, 130],
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        { "name": "heightmap", "type": "array", "link": 3 }
      ],
      "outputs": [],
      "title": "Generate Terrain",
      "properties": { "water": true }
    }
  ],
  "links": [
    [1, 1, 0, 3, 0, "array"],
    [2, 2, 0, 3, 1, "array"],
    [3, 3, 0, 4, 0, "array"]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

// Pipeline E — Wave-Harmonic (full — all 4 phases)
// Perlin (octaves=6, freq=5) + Wave Interference (sources=8, freq=2) → Covariant Curvature → Thermal Erosion → Generate Terrain
const experimentPipelineE = {
  "last_node_id": 5,
  "last_link_id": 4,
  "nodes": [
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": { "0": 80, "1": 50 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "noise", "type": "array", "links": [1], "slot_index": 0 }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 5,
        "octaves": 6,
        "amplitude": 1,
        "offset": 0,
        "seed": 1
      }
    },
    {
      "id": 2,
      "type": "Generator/Wave Interference",
      "pos": { "0": 80, "1": 410 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "out", "type": "array", "links": [2], "slot_index": 0 }
      ],
      "title": "Wave Interference",
      "properties": {
        "frequency": 2,
        "sources": 8,
        "phase": 0,
        "decay": 0,
        "seed": 1
      }
    },
    {
      "id": 3,
      "type": "Combine/Covariant Curvature",
      "pos": { "0": 370, "1": 220 },
      "size": { "0": 140, "1": 184 },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        { "name": "Base (P)", "type": "array", "link": 1 },
        { "name": "Wave (ψ)", "type": "array", "link": 2 }
      ],
      "outputs": [
        { "name": "out", "type": "array", "links": [3], "slot_index": 0 }
      ],
      "title": "Covariant Curvature",
      "properties": {}
    },
    {
      "id": 4,
      "type": "Filter/Thermal Erosion",
      "pos": { "0": 580, "1": 210 },
      "size": { "0": 210, "1": 220 },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        { "name": "value", "type": "array", "link": 3 }
      ],
      "outputs": [
        { "name": "out", "type": "array", "links": [4], "slot_index": 0 }
      ],
      "title": "Thermal Erosion",
      "properties": {
        "iterations": 10,
        "rate": 0.5
      }
    },
    {
      "id": 5,
      "type": "Output/Generate Terrain",
      "pos": { "0": 860, "1": 230 },
      "size": [220, 130],
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        { "name": "heightmap", "type": "array", "link": 4 }
      ],
      "outputs": [],
      "title": "Generate Terrain",
      "properties": { "water": true }
    }
  ],
  "links": [
    [1, 1, 0, 3, 0, "array"],
    [2, 2, 0, 3, 1, "array"],
    [3, 3, 0, 4, 0, "array"],
    [4, 4, 0, 5, 0, "array"]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

const exampleCircularMountainWall = {
  "last_node_id": 10,
  "last_link_id": 12,
  "nodes": [
    {
      "id": 3,
      "type": "Math/Subtract",
      "pos": { "0": 417, "1": 295 },
      "size": { "0": 140, "1": 184 },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        { "name": "A", "type": "array", "link": 1 },
        { "name": "B", "type": "array", "link": 2 }
      ],
      "outputs": [
        { "name": "out", "type": "array", "links": [5], "slot_index": 0 }
      ],
      "title": "Subtract",
      "properties": {}
    },
    {
      "id": 6,
      "type": "Filter/Blur",
      "pos": { "0": 649, "1": 271 },
      "size": { "0": 210, "1": 220 },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        { "name": "value", "type": "array", "link": 5 }
      ],
      "outputs": [
        { "name": "out", "type": "array", "links": [10], "slot_index": 0 }
      ],
      "title": "Blur",
      "properties": {
        "amount": 3.6,
        "passes": 3
      }
    },
    {
      "id": 9,
      "type": "Math/Multiply",
      "pos": { "0": 1007, "1": 375 },
      "size": { "0": 140, "1": 184 },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        { "name": "A", "type": "array", "link": 10 },
        { "name": "B", "type": "array", "link": 11 }
      ],
      "outputs": [
        { "name": "out", "type": "array", "links": [12], "slot_index": 0 }
      ],
      "title": "Multiply",
      "properties": {}
    },
    {
      "id": 1,
      "type": "Generator/Circle",
      "pos": { "0": 110, "1": 269 },
      "size": { "0": 210, "1": 244 },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "out", "type": "array", "links": [1], "slot_index": 0 }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.58,
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": 2,
      "type": "Generator/Circle",
      "pos": { "0": 120, "1": 559 },
      "size": { "0": 210, "1": 244 },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "out", "type": "array", "links": [2], "slot_index": 0 }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.50,
        "x": 0.5,
        "y": 0.5
      }
    },
    {
      "id": 10,
      "type": "Output/Generate Terrain",
      "pos": { "0": 1230, "1": 387 },
      "size": [220, 175],
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        { "name": "heightmap", "type": "array", "link": 12 }
      ],
      "outputs": [],
      "title": "Generate Terrain",
      "properties": {
        "water": true,
        "resolution": 1024,
        "heightScale": 0.26
      }
    },
    {
      "id": 7,
      "type": "Generator/Perlin",
      "pos": { "0": 643, "1": 548 },
      "size": { "0": 210, "1": 292 },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "noise", "type": "array", "links": [11], "slot_index": 0 }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 20,
        "octaves": 2.3,
        "amplitude": 1.0,
        "offset": 0,
        "seed": 330
      }
    }
  ],
  "links": [
    [1, 1, 0, 3, 0, "array"],
    [2, 2, 0, 3, 1, "array"],
    [5, 3, 0, 6, 0, "array"],
    [10, 6, 0, 9, 0, "array"],
    [11, 7, 0, 9, 1, "array"],
    [12, 9, 0, 10, 0, "array"]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};