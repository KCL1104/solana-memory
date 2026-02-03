/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/agent_memory.json`.
 */
export type AgentMemory = {
  "address": "HLtbU8HoiLhXtjQbJKshceuQK1f59xW7hT99P5pSn62L",
  "metadata": {
    "name": "agentMemory",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "agentKey"
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "agentProfile",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "encryptionPubkey",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "storeMemory",
      "discriminator": [
        168,
        103,
        88,
        240,
        93,
        185,
        30,
        235
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "memoryShard",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "key",
          "type": "string"
        },
        {
          "name": "contentHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "contentSize",
          "type": "u32"
        },
        {
          "name": "metadata",
          "type": {
            "defined": {
              "name": "memoryMetadata"
            }
          }
        }
      ]
    },
    {
      "name": "deleteMemory",
      "discriminator": [
        197,
        189,
        203,
        106,
        20,
        99,
        209,
        134
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "memoryShard",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    },
    {
      "name": "updateProfile",
      "discriminator": [
        98,
        67,
        99,
        206,
        86,
        115,
        175,
        1
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "agentProfile",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "capabilities",
          "type": {
            "option": {
              "vec": "string"
            }
          }
        },
        {
          "name": "isPublic",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "recordTaskCompletion",
      "discriminator": [
        222,
        233,
        200,
        60,
        215,
        42,
        97,
        158
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "agentProfile",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "grantAccess",
      "discriminator": [
        66,
        88,
        87,
        113,
        39,
        22,
        27,
        165
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "grantee"
        },
        {
          "name": "accessGrant",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "expiration",
          "type": {
            "option": "i64"
          }
        }
      ]
    },
    {
      "name": "revokeAccess",
      "discriminator": [
        106,
        128,
        38,
        169,
        103,
        238,
        102,
        147
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault"
        },
        {
          "name": "accessGrant",
          "writable": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "memoryVault",
      "discriminator": [
        113,
        139,
        57,
        17,
        27,
        116,
        85,
        55
      ]
    },
    {
      "name": "memoryShard",
      "discriminator": [
        178,
        166,
        103,
        125,
        117,
        239,
        38,
        123
      ]
    },
    {
      "name": "agentProfile",
      "discriminator": [
        60,
        227,
        42,
        24,
        0,
        87,
        86,
        205
      ]
    },
    {
      "name": "accessGrant",
      "discriminator": [
        167,
        55,
        184,
        237,
        74,
        242,
        0,
        109
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "keyTooLong",
      "msg": "Memory key too long (max 64 characters)"
    },
    {
      "code": 6001,
      "name": "contentTooLarge",
      "msg": "Content too large (max 10MB)"
    },
    {
      "code": 6002,
      "name": "nameTooLong",
      "msg": "Name too long (max 128 characters)"
    },
    {
      "code": 6003,
      "name": "tooManyCapabilities",
      "msg": "Too many capabilities (max 20)"
    },
    {
      "code": 6004,
      "name": "capabilityTooLong",
      "msg": "Capability description too long (max 64 characters)"
    },
    {
      "code": 6005,
      "name": "accessExpired",
      "msg": "Access expired"
    },
    {
      "code": 6006,
      "name": "accessNotGranted",
      "msg": "Access not granted"
    }
  ],
  "types": [
    {
      "name": "memoryMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryType",
            "type": {
              "defined": {
                "name": "memoryType"
              }
            }
          },
          {
            "name": "importance",
            "type": "u8"
          },
          {
            "name": "tags",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "ipfsCid",
            "type": {
              "option": {
                "array": [
                  "u8",
                  46
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "memoryType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "conversation"
          },
          {
            "name": "learning"
          },
          {
            "name": "preference"
          },
          {
            "name": "task"
          },
          {
            "name": "relationship"
          },
          {
            "name": "knowledge"
          },
          {
            "name": "system"
          }
        ]
      }
    },
    {
      "name": "memoryVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "agentKey",
            "type": "pubkey"
          },
          {
            "name": "encryptionPubkey",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "memoryCount",
            "type": "u32"
          },
          {
            "name": "totalMemorySize",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "memoryShard",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "key",
            "type": "string"
          },
          {
            "name": "contentHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "contentSize",
            "type": "u32"
          },
          {
            "name": "metadata",
            "type": {
              "defined": {
                "name": "memoryMetadata"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "version",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "agentProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agentKey",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "capabilities",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "reputationScore",
            "type": "u32"
          },
          {
            "name": "tasksCompleted",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "isPublic",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "accessGrant",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "grantee",
            "type": "pubkey"
          },
          {
            "name": "grantedAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
