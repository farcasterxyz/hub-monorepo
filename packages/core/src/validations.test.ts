import { faker } from "@faker-js/faker";
import * as protobufs from "./protobufs";
import { err, ok } from "neverthrow";
import { bytesToUtf8String, utf8StringToBytes } from "./bytes";
import { HubError } from "./errors";
import { Factories } from "./factories";
import { fromFarcasterTime, getFarcasterTime } from "./time";
import * as validations from "./validations";
import { makeVerificationEthAddressClaim } from "./verifications";
import { UserDataType, UserNameType } from "@farcaster/hub-nodejs";
import { defaultL1PublicClient } from "./eth/clients";
import { optimism } from "viem/chains";
import { jest } from "@jest/globals";

const signer = Factories.Ed25519Signer.build();
const ethSigner = Factories.Eip712Signer.build();
let ethSignerKey: Uint8Array;

beforeAll(async () => {
  ethSignerKey = (await ethSigner.getSignerKey())._unsafeUnwrap();
});

afterEach(async () => {
  jest.restoreAllMocks();
});

describe("validateFid", () => {
  test("succeeds", () => {
    const fid = Factories.Fid.build();
    expect(validations.validateFid(fid)).toEqual(ok(fid));
  });

  test("fails with 0", () => {
    expect(validations.validateFid(0)).toEqual(err(new HubError("bad_request.validation_failure", "fid is missing")));
  });

  test("fails with negative number", () => {
    expect(validations.validateFid(-1)).toEqual(
      err(new HubError("bad_request.validation_failure", "fid must be positive")),
    );
  });

  test("fails when undefined", () => {
    expect(validations.validateFid(undefined)).toEqual(
      err(new HubError("bad_request.validation_failure", "fid is missing")),
    );
  });

  test("fails with non-integer number", () => {
    expect(validations.validateFid(1.5)).toEqual(
      err(new HubError("bad_request.validation_failure", "fid must be an integer")),
    );
  });
});

describe("validateFname", () => {
  test("succeeds with valid byte array input", () => {
    const fname = Factories.Fname.build();
    expect(validations.validateFname(fname)).toEqual(ok(fname));
  });

  test("succeeds with valid string inpt", () => {
    const fname = bytesToUtf8String(Factories.Fname.build())._unsafeUnwrap();
    expect(validations.validateFname(fname)).toEqual(ok(fname));
  });

  test("fails when greater than 16 characters", () => {
    const fname = faker.random.alpha(17);
    expect(validations.validateFname(fname)).toEqual(
      err(new HubError("bad_request.validation_failure", `fname "${fname}" > 16 characters`)),
    );
  });

  test("fails with an empty string", () => {
    const fname = "";
    expect(validations.validateFname(fname)).toEqual(
      err(new HubError("bad_request.validation_failure", "fname is missing")),
    );
  });

  test("fails when undefined", () => {
    expect(validations.validateFname(undefined)).toEqual(
      err(new HubError("bad_request.validation_failure", "fname is missing")),
    );
  });

  test("fails with invalid characters", () => {
    const fname = "@fname";
    expect(validations.validateFname(fname)).toEqual(
      err(new HubError("bad_request.validation_failure", `fname "${fname}" doesn't match ${validations.FNAME_REGEX}`)),
    );
  });

  test("does not allow names ending with .eth", () => {
    const fname = "fname.eth";
    expect(validations.validateFname(fname)).toEqual(
      err(new HubError("bad_request.validation_failure", `fname "${fname}" doesn't match ${validations.FNAME_REGEX}`)),
    );
  });
});

describe("validateENSname", () => {
  test("succeeds with valid byte array input", () => {
    const ensName = Factories.EnsName.build();
    expect(validations.validateEnsName(ensName)).toEqual(ok(ensName));
  });

  test("succeeds with valid string input", () => {
    const ensName = bytesToUtf8String(Factories.EnsName.build())._unsafeUnwrap();
    expect(validations.validateEnsName(ensName)).toEqual(ok(ensName));
  });

  test("fails when greater than 20 characters", () => {
    const ensName = faker.random.alpha(17).concat(".eth");
    expect(validations.validateEnsName(ensName)).toEqual(
      err(new HubError("bad_request.validation_failure", `ensName "${ensName}" > 20 characters`)),
    );
  });

  test("fails with an empty string", () => {
    const ensName = "";
    expect(validations.validateEnsName(ensName)).toEqual(
      err(new HubError("bad_request.validation_failure", "ensName is missing")),
    );
  });

  test("fails when undefined", () => {
    expect(validations.validateEnsName(undefined)).toEqual(
      err(new HubError("bad_request.validation_failure", "ensName is missing")),
    );
  });

  test("fails with invalid characters", () => {
    const ensName = "-fname.eth";
    expect(validations.validateEnsName(ensName)).toEqual(
      err(
        new HubError("bad_request.validation_failure", `ensName "${ensName}" doesn't match ${validations.FNAME_REGEX}`),
      ),
    );
  });

  test("fails when name does not end with .eth", () => {
    const ensName = "ensname";
    expect(validations.validateEnsName(ensName)).toEqual(
      err(new HubError("bad_request.validation_failure", `ensName "${ensName}" doesn't end with .eth`)),
    );
  });

  test("fails with subdomains", () => {
    const ensName = "abc.def.eth";
    expect(validations.validateEnsName(ensName)).toEqual(
      err(new HubError("bad_request.validation_failure", `ensName "${ensName}" unsupported subdomain`)),
    );
  });

  test("fails when unable to normalize ens names", () => {
    const ensName = "2l--3-6b-mi-d-b.eth";
    expect(validations.validateEnsName(ensName)).toEqual(
      err(new HubError("bad_request.validation_failure", `ensName "${ensName}" is not a valid ENS name`)),
    );
  });
});

describe("validateCastId", () => {
  test("succeeds", async () => {
    const castId = Factories.CastId.build();
    expect(validations.validateCastId(castId)).toEqual(ok(castId));
  });

  test("fails when fid is invalid", async () => {
    const castId = Factories.CastId.build({ fid: 0 });
    expect(validations.validateCastId(castId)).toEqual(
      err(new HubError("bad_request.validation_failure", "fid is missing")),
    );
  });

  test("fails when hash is invalid", async () => {
    const castId = Factories.CastId.build({ hash: new Uint8Array() });
    expect(validations.validateCastId(castId)).toEqual(
      err(new HubError("bad_request.validation_failure", "hash is missing")),
    );
  });

  test("fails when both fid and tsHash are invalid", async () => {
    const castId = Factories.CastId.build({ fid: undefined, hash: undefined });
    expect(validations.validateCastId(castId)).toEqual(
      err(new HubError("bad_request.validation_failure", "fid is missing, hash is missing")),
    );
  });
});

describe("validateEthAddress", () => {
  test("succeeds", () => {
    expect(validations.validateEthAddress(ethSignerKey)).toEqual(ok(ethSignerKey));
  });

  test("fails with longer address", () => {
    const longAddress = Factories.Bytes.build({}, { transient: { length: 21 } });
    expect(validations.validateEthAddress(longAddress)).toEqual(
      err(new HubError("bad_request.validation_failure", "address must be 20 bytes")),
    );
  });

  test("fails with shorter address", () => {
    const shortAddress = ethSignerKey.subarray(0, -1);
    expect(validations.validateEthAddress(shortAddress)).toEqual(
      err(new HubError("bad_request.validation_failure", "address must be 20 bytes")),
    );
  });
});

describe("validateEthBlockHash", () => {
  test("succeeds", () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 32 } });
    expect(validations.validateEthBlockHash(blockHash)).toEqual(ok(blockHash));
  });

  test("fails when greater than 32 bytes", () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validations.validateEthBlockHash(blockHash)).toEqual(
      err(new HubError("bad_request.validation_failure", "blockHash must be 32 bytes")),
    );
  });

  test("fails when less than 32 bytes", () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 31 } });
    expect(validations.validateEthBlockHash(blockHash)).toEqual(
      err(new HubError("bad_request.validation_failure", "blockHash must be 32 bytes")),
    );
  });

  test("fails when undefined", () => {
    expect(validations.validateEthBlockHash(undefined)).toEqual(
      err(new HubError("bad_request.validation_failure", "blockHash is missing")),
    );
  });
});

describe("validateEd25519PublicKey", () => {
  let publicKey: Uint8Array;

  beforeAll(async () => {
    publicKey = (await signer.getSignerKey())._unsafeUnwrap();
  });

  test("succeeds", () => {
    expect(validations.validateEd25519PublicKey(publicKey)).toEqual(ok(publicKey));
  });

  test("fails with longer key", () => {
    const longKey = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validations.validateEd25519PublicKey(longKey)).toEqual(
      err(new HubError("bad_request.validation_failure", "publicKey must be 32 bytes")),
    );
  });

  test("fails with shorter key", () => {
    const shortKey = publicKey.subarray(0, -1);
    expect(validations.validateEd25519PublicKey(shortKey)).toEqual(
      err(new HubError("bad_request.validation_failure", "publicKey must be 32 bytes")),
    );
  });
});

describe("validateCastAddBody", () => {
  test("succeeds", () => {
    const body = Factories.CastAddBody.build();
    expect(validations.validateCastAddBody(body)).toEqual(ok(body));
  });

  test("when text is empty", () => {
    const body = Factories.CastAddBody.build({ text: "", mentions: [], mentionsPositions: [] });
    expect(validations.validateCastAddBody(body)).toEqual(ok(body));
  });

  test("with repeated mentionsPositions", () => {
    const body = Factories.CastAddBody.build({
      text: "Hello ",
      mentions: [Factories.Fid.build(), Factories.Fid.build()],
      mentionsPositions: [6, 6],
    });
    expect(validations.validateCastAddBody(body)).toEqual(ok(body));
  });

  describe("when string embeds are allowed", () => {
    test("with embedsDeprecated if allowed", () => {
      const body = Factories.CastAddBody.build({
        embedsDeprecated: [faker.internet.url(), faker.internet.url()],
        embeds: [],
      });
      expect(validations.validateCastAddBody(body, true)).toEqual(ok(body));
    });

    describe("fails", () => {
      let body: protobufs.CastAddBody;
      let hubErrorMessage: string;

      afterEach(() => {
        expect(validations.validateCastAddBody(body, true)).toEqual(
          err(new HubError("bad_request.validation_failure", hubErrorMessage)),
        );
      });

      test("with more than 2 string embeds", () => {
        body = Factories.CastAddBody.build({
          embedsDeprecated: [faker.internet.url(), faker.internet.url(), faker.internet.url()],
          embeds: [],
        });
        hubErrorMessage = "string embeds > 2";
      });

      test("with an empty embed url string", () => {
        body = Factories.CastAddBody.build({
          embedsDeprecated: [""],
          embeds: [],
        });
        hubErrorMessage = "url < 1 byte";
      });

      test("with an embed url string over 256 ASCII characters", () => {
        body = Factories.CastAddBody.build({ embeds: [], embedsDeprecated: [faker.random.alphaNumeric(257)] });
        hubErrorMessage = "url > 256 bytes";
      });

      test("with an embed url string over 256 bytes", () => {
        body = Factories.CastAddBody.build({ embeds: [], embedsDeprecated: [`${faker.random.alphaNumeric(254)}🤓`] });
        hubErrorMessage = "url > 256 bytes";
      });
    });
  });

  describe("fails", () => {
    let body: protobufs.CastAddBody;
    let hubErrorMessage: string;

    afterEach(() => {
      expect(validations.validateCastAddBody(body)).toEqual(
        err(new HubError("bad_request.validation_failure", hubErrorMessage)),
      );
    });

    test("when text is undefined", () => {
      body = Factories.CastAddBody.build({ text: undefined });
      hubErrorMessage = "text is missing";
    });

    test("when text is null", () => {
      body = Factories.CastAddBody.build({ text: null as unknown as undefined });
      hubErrorMessage = "text is missing";
    });

    test("when text is longer than 320 ASCII characters", () => {
      body = Factories.CastAddBody.build({ text: faker.random.alphaNumeric(321) });
      hubErrorMessage = "text > 320 bytes";
    });

    test("when text is longer than 320 bytes", () => {
      const text = `${faker.random.alphaNumeric(318)}🤓`;
      expect(text.length).toEqual(320);
      body = Factories.CastAddBody.build({ text });
      hubErrorMessage = "text > 320 bytes";
    });

    test("with more than 2 embeds", () => {
      body = Factories.CastAddBody.build({
        embeds: [Factories.Embed.build(), Factories.Embed.build(), Factories.Embed.build()],
      });
      hubErrorMessage = "embeds > 2";
    });

    test("with an empty embed url string", () => {
      body = Factories.CastAddBody.build({
        embeds: [{ url: "" }],
      });
      hubErrorMessage = "url < 1 byte";
    });

    test("with an embed url string over 256 ASCII characters", () => {
      body = Factories.CastAddBody.build({
        embeds: [{ url: faker.random.alphaNumeric(257) }],
      });
      hubErrorMessage = "url > 256 bytes";
    });

    test("with an embed url string over 256 bytes", () => {
      body = Factories.CastAddBody.build({
        embeds: [{ url: `${faker.random.alphaNumeric(254)}🤓` }],
      });
      hubErrorMessage = "url > 256 bytes";
    });

    test("with embedsDeprecated", () => {
      body = Factories.CastAddBody.build({
        embeds: [],
        embedsDeprecated: [faker.internet.url(), faker.internet.url()],
      });
      hubErrorMessage = "string embeds have been deprecated";
    });

    test("with an invalid embed CastId", () => {
      body = Factories.CastAddBody.build({
        embeds: [{ castId: Factories.CastId.build({ fid: undefined }) }],
      });
      hubErrorMessage = "fid is missing";
    });

    test("when parent fid is missing", () => {
      body = Factories.CastAddBody.build({
        parentCastId: Factories.CastId.build({ fid: undefined }),
      });
      hubErrorMessage = "fid is missing";
    });

    test("when parent hash is missing", () => {
      body = Factories.CastAddBody.build({ parentCastId: Factories.CastId.build({ hash: undefined }) });
      hubErrorMessage = "hash is missing";
    });

    test("with a parentUrl over 256 bytes", () => {
      body = Factories.CastAddBody.build({
        parentUrl: faker.random.alphaNumeric(257),
        parentCastId: undefined,
      });
      hubErrorMessage = "url > 256 bytes";
    });

    test("with a parentUrl of empty string", () => {
      body = Factories.CastAddBody.build({ parentUrl: "", parentCastId: undefined });
      hubErrorMessage = "url < 1 byte";
    });

    test("with both parentUrl and parentCastId", () => {
      body = Factories.CastAddBody.build({
        parentUrl: faker.internet.url(),
        parentCastId: Factories.CastId.build(),
      });
      hubErrorMessage = "cannot use both parentUrl and parentCastId";
    });

    test("with up to 10 mentions", () => {
      const body = Factories.CastAddBody.build({
        text: "",
        mentions: [
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
        ],
        mentionsPositions: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
      expect(validations.validateCastAddBody(body)).toEqual(ok(body));
    });

    test("with more than 10 mentions", () => {
      body = Factories.CastAddBody.build({
        mentions: [
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
        ],
      });
      hubErrorMessage = "mentions > 10";
    });

    test("with more mentions than mentionsPositions", () => {
      body = Factories.CastAddBody.build({
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [0],
      });
      hubErrorMessage = "mentions and mentionsPositions must match";
    });

    test("with out of range mentionsPositions", () => {
      body = Factories.CastAddBody.build({
        text: "a",
        mentions: [Factories.Fid.build()],
        mentionsPositions: [2],
      });
      hubErrorMessage = "mentionsPositions must be a position in text";
    });

    test("with mentionsPositions within byte length of text", () => {
      const body = Factories.CastAddBody.build({
        text: "🤓", // 4 bytes in utf8
        mentions: [Factories.Fid.build()],
        mentionsPositions: [4],
      });
      expect(validations.validateCastAddBody(body)).toEqual(ok(body));
    });

    test("with mentionsPositions out of range of byte length of text", () => {
      body = Factories.CastAddBody.build({
        text: "🤓", // 4 bytes in utf8
        mentions: [Factories.Fid.build()],
        mentionsPositions: [5],
      });
      hubErrorMessage = "mentionsPositions must be a position in text";
    });

    test("with non-integer mentionsPositions", () => {
      body = Factories.CastAddBody.build({ mentions: [Factories.Fid.build()], mentionsPositions: [1.5] });
      hubErrorMessage = "mentionsPositions must be integers";
    });

    test("with out of order mentionsPositions", () => {
      body = Factories.CastAddBody.build({
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [2, 1],
      });
      hubErrorMessage = "mentionsPositions must be sorted in ascending order";
    });
  });
});

describe("validateCastRemoveBody", () => {
  test("succeeds", async () => {
    const body = Factories.CastRemoveBody.build();
    expect(validations.validateCastRemoveBody(body)._unsafeUnwrap()).toEqual(body);
  });

  test("fails when targetHash is missing", async () => {
    const body = Factories.CastRemoveBody.build({ targetHash: undefined });
    expect(validations.validateCastRemoveBody(body)._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "hash is missing"),
    );
  });
});

describe("validateReactionBody", () => {
  test("succeeds", () => {
    const body = Factories.ReactionBody.build();
    expect(validations.validateReactionBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe("fails", () => {
    let body: protobufs.ReactionBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateReactionBody(body)).toEqual(
        err(new HubError("bad_request.validation_failure", hubErrorMessage)),
      );
    });

    test("with invalid reaction type", () => {
      body = Factories.ReactionBody.build({ type: 100 as unknown as protobufs.ReactionType });
      hubErrorMessage = "invalid reaction type";
    });

    test("without target", () => {
      body = Factories.ReactionBody.build({ targetCastId: undefined, targetUrl: undefined });
      hubErrorMessage = "target is missing";
    });

    test("when cast fid is missing", () => {
      body = Factories.ReactionBody.build({
        targetCastId: Factories.CastId.build({ fid: undefined }),
      });
      hubErrorMessage = "fid is missing";
    });

    test("when cast hash is missing", () => {
      body = Factories.ReactionBody.build({
        targetCastId: Factories.CastId.build({ hash: undefined }),
      });
      hubErrorMessage = "hash is missing";
    });

    test("with a targetUrl over 256 bytes", () => {
      body = Factories.ReactionBody.build({
        targetUrl: faker.random.alphaNumeric(257),
        targetCastId: undefined,
      });
      hubErrorMessage = "url > 256 bytes";
    });

    test("with a targetUrl of empty string", () => {
      body = Factories.ReactionBody.build({ targetUrl: "", targetCastId: undefined });
      hubErrorMessage = "url < 1 byte";
    });

    test("with both targetUrl and targetCastId", () => {
      body = Factories.ReactionBody.build({
        targetUrl: faker.internet.url(),
        targetCastId: Factories.CastId.build(),
      });
      hubErrorMessage = "cannot use both targetUrl and targetCastId";
    });
  });
});

describe("validateVerificationAddEthAddressBody", () => {
  const fid = Factories.Fid.build();
  const network = Factories.FarcasterNetwork.build();

  test("succeeds", async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid, network } });
    const result = await validations.validateVerificationAddEthAddressBody(body, fid, network);
    expect(result).toEqual(ok(body));
  });

  describe("fails", () => {
    let body: protobufs.VerificationAddEthAddressBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      // TODO: improve VerificationAddEthAddressBody factory so that it doesn't always try to generate ethSignature
      const result = await validations.validateVerificationAddEthAddressBody(body, fid, network);
      expect(result).toEqual(err(new HubError("bad_request.validation_failure", hubErrorMessage)));
    });

    test("with missing eth address", async () => {
      body = Factories.VerificationAddEthAddressBody.build({ address: undefined });
      hubErrorMessage = "address is missing";
    });

    test("with eth address larger than 20 bytes", async () => {
      body = Factories.VerificationAddEthAddressBody.build({
        address: Factories.Bytes.build({}, { transient: { length: 21 } }),
      });
      hubErrorMessage = "address must be 20 bytes";
    });

    test("with missing block hash", async () => {
      body = Factories.VerificationAddEthAddressBody.build({ blockHash: undefined });
      hubErrorMessage = "blockHash is missing";
    });

    test("with block hash larger than 32 bytes", async () => {
      body = Factories.VerificationAddEthAddressBody.build({
        blockHash: Factories.Bytes.build({}, { transient: { length: 33 } }),
      });
      hubErrorMessage = "blockHash must be 32 bytes";
    });
  });
});

describe("validateVerificationAddEthAddressSignature", () => {
  const fid = Factories.Fid.build();
  const network = Factories.FarcasterNetwork.build();

  test("succeeds for eoas", async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid, network } });
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result.isOk()).toBeTruthy();
  });

  test("fails with invalid eth signature", async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature: Factories.Bytes.build({}, { transient: { length: 1 } }),
    });
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result).toEqual(err(new HubError("unknown", "Cannot convert 0x to a BigInt")));
  });

  test("fails with invalid verificationType", async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature: Factories.Bytes.build({}, { transient: { length: 1 } }),
      verificationType: 2,
    });
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result).toEqual(err(new HubError("bad_request.invalid_param", "Invalid verification type")));
  });

  test("fails with invalid chainId", async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature: Factories.Bytes.build({}, { transient: { length: 1 } }),
      chainId: 7,
      verificationType: 1,
    });
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result).toEqual(err(new HubError("bad_request.invalid_param", "Invalid chain ID")));
  });

  test("fails if client not provided for chainId", async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature: Factories.Bytes.build({}, { transient: { length: 1 } }),
      chainId: 1,
      verificationType: 1,
    });
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network, {});
    expect(result).toEqual(err(new HubError("bad_request.invalid_param", "RPC client not provided for chainId 1")));
  });

  test("fails if ethSignature is > 256 bytes", async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature: Factories.Bytes.build({}, { transient: { length: 257 } }),
    });
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network, {});
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "ethSignature > 256 bytes")));
  });

  test("succeeds for contract signatures", async () => {
    jest.spyOn(defaultL1PublicClient, "verifyTypedData").mockImplementation(() => {
      return Promise.resolve(true);
    });
    const chainId = 1;
    const publicClients = {
      [chainId]: defaultL1PublicClient,
    };
    const body = await Factories.VerificationAddEthAddressBody.create(
      {
        chainId,
        verificationType: 1,
      },
      { transient: { fid, network, contractSignature: true } },
    );
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network, publicClients);
    expect(result.isOk()).toBeTruthy();
  });

  test("fails with invalid contract signature", async () => {
    jest.spyOn(defaultL1PublicClient, "verifyTypedData").mockImplementation(() => {
      return Promise.resolve(false);
    });
    const chainId = 1;
    const publicClients = {
      [chainId]: defaultL1PublicClient,
    };
    const body = await Factories.VerificationAddEthAddressBody.create(
      {
        chainId,
        verificationType: 1,
      },
      { transient: { fid, network, contractSignature: true } },
    );
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network, publicClients);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid ethSignature")));
  });

  test("fails with eth signature from different address", async () => {
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationEthAddressClaim(fid, ethSignerKey, network, blockHash)._unsafeUnwrap();
    const ethSignature = (await ethSigner.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
    expect(ethSignature).toBeTruthy();
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature,
      blockHash,
      address: Factories.EthAddress.build(),
    });
    const result = await validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid ethSignature")));
  });
});

describe("validateVerificationRemoveBody", () => {
  test("succeeds", () => {
    const body = Factories.VerificationRemoveBody.build();
    expect(validations.validateVerificationRemoveBody(body)).toEqual(ok(body));
  });

  describe("fails", () => {
    let body: protobufs.VerificationRemoveBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateVerificationRemoveBody(body)).toEqual(
        err(new HubError("bad_request.validation_failure", hubErrorMessage)),
      );
    });

    test("when address is missing", async () => {
      body = Factories.VerificationRemoveBody.build({
        address: undefined,
      });
      hubErrorMessage = "address is missing";
    });

    test("with invalid address", async () => {
      body = Factories.VerificationRemoveBody.build({
        address: Factories.Bytes.build({}, { transient: { length: 21 } }),
      });
      hubErrorMessage = "address must be 20 bytes";
    });
  });
});

describe("validateUserDataAddBody", () => {
  test("succeeds", async () => {
    const body = Factories.UserDataBody.build();
    expect(validations.validateUserDataAddBody(body)).toEqual(ok(body));
  });

  test("succeeds for ens names", async () => {
    const body = Factories.UserDataBody.build({ type: UserDataType.USERNAME, value: "averylongensname.eth" });
    expect(validations.validateUserDataAddBody(body)).toEqual(ok(body));
  });

  describe("fails", () => {
    let body: protobufs.UserDataBody;
    let hubErrorMessage: string;

    afterEach(() => {
      expect(validations.validateUserDataAddBody(body)).toEqual(
        err(new HubError("bad_request.validation_failure", hubErrorMessage)),
      );
    });

    test("when pfp > 256", () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.PFP,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = "pfp value > 256";
    });

    test("when display > 32", () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.DISPLAY,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = "display value > 32";
    });

    test("when bio > 256", () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.BIO,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = "bio value > 256";
    });

    test("when url > 256", () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.URL,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = "url value > 256";
    });
  });
});

describe("validateUsernameProof", () => {
  test("when timestamp does not match message timestamp", async () => {
    const proof = await Factories.UsernameProofMessage.create();
    proof.data.timestamp = proof.data.timestamp + 10;
    const result = await validations.validateUsernameProofBody(proof.data.usernameProofBody, proof.data);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError(
        "bad_request.validation_failure",
        "timestamp in username proof does not match timestamp in message data",
      ),
    );
  });
  test("when name does not end with .eth", async () => {
    const proof = await Factories.UsernameProofMessage.create({
      data: { usernameProofBody: { name: utf8StringToBytes("aname")._unsafeUnwrap() } },
    });
    const result = await validations.validateUsernameProofBody(proof.data.usernameProofBody, proof.data);
    const hubError = result._unsafeUnwrapErr();
    expect(hubError.errCode).toEqual("bad_request.validation_failure");
    expect(hubError.message).toMatch("doesn't end with .eth");
  });
  test("when type is unsupported", async () => {
    const proof = await Factories.UsernameProofMessage.create({
      data: { usernameProofBody: { type: UserNameType.USERNAME_TYPE_NONE } },
    });
    const result = await validations.validateUsernameProofBody(proof.data.usernameProofBody, proof.data);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "invalid username type: 0"),
    );
  });
  test("when type is fname", async () => {
    const proof = await Factories.UsernameProofMessage.create({
      data: { usernameProofBody: { type: UserNameType.USERNAME_TYPE_FNAME } },
    });
    const result = await validations.validateUsernameProofBody(proof.data.usernameProofBody, proof.data);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "invalid username type: 1"),
    );
  });
  test("succeeds for a valid message", async () => {
    const proof = await Factories.UsernameProofMessage.create();
    const result = await validations.validateUsernameProofBody(proof.data.usernameProofBody, proof.data);
    expect(result.isOk()).toBeTruthy();
  });
});

describe("validateMessage", () => {
  test("succeeds with Ed25519 signer", async () => {
    const message = await Factories.Message.create({}, { transient: { signer } });
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test("fails with EIP712 signer and non-signer message type", async () => {
    // Default message type is CastAdd
    const message = await Factories.Message.create({}, { transient: { signer: ethSigner } });
    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid signatureScheme")));
  });

  test("fails with invalid hashScheme", async () => {
    const message = await Factories.Message.create({
      hashScheme: 10 as unknown as protobufs.HashScheme.BLAKE3,
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid hashScheme")));
  });

  test("fails with invalid hash", async () => {
    const message = await Factories.Message.create({
      hash: Factories.Bytes.build({}, { transient: { length: 1 } }),
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid hash")));
  });

  test("fails with invalid signatureScheme", async () => {
    const message = await Factories.Message.create({
      signatureScheme: 10 as unknown as protobufs.SignatureScheme.ED25519,
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid signatureScheme")));
  });

  test("fails with invalid signature", async () => {
    const message = await Factories.Message.create({
      signature: Factories.Ed25519Signature.build(),
      signer: Factories.Ed25519PPublicKey.build(),
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid signature")));
  });

  test("fails with invalid signature data", async () => {
    const message = await Factories.Message.create({
      signature: Factories.Bytes.build({}, { transient: { length: 0 } }),
      signer: Factories.Ed25519PPublicKey.build(),
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid signature")));
  });

  test("fails with invalid signer data", async () => {
    const message = await Factories.Message.create({
      signature: Factories.Ed25519Signature.build(),
      signer: Factories.Bytes.build({}, { transient: { length: 0 } }),
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError("bad_request.validation_failure", "invalid signature")));
  });
});

describe("validateMessageData", () => {
  test("fails with timestamp more than 10 mins in the future", async () => {
    const data = Factories.MessageData.build({
      timestamp: getFarcasterTime()._unsafeUnwrap() + validations.ALLOWED_CLOCK_SKEW_SECONDS + 1,
    });
    const result = await validations.validateMessageData(data);
    expect(result).toEqual(
      err(new HubError("bad_request.validation_failure", "timestamp more than 10 mins in the future")),
    );
  });

  describe("with stubbed Date.now", () => {
    let realDateNow: () => number;

    beforeAll(() => {
      realDateNow = Date.now.bind(global.Date);
      global.Date.now = () => fromFarcasterTime(validations.EMBEDS_V1_CUTOFF)._unsafeUnwrap();
    });

    afterAll(() => {
      global.Date.now = realDateNow;
    });

    test("fails with embedsDeprecated when timestamp is past cut-off", async () => {
      const data = Factories.CastAddData.build({
        timestamp: validations.EMBEDS_V1_CUTOFF + 1,
        castAddBody: Factories.CastAddBody.build({ embeds: [], embedsDeprecated: [faker.internet.url()] }),
      });
      const result = await validations.validateMessageData(data);
      expect(result).toEqual(err(new HubError("bad_request.validation_failure", "string embeds have been deprecated")));
    });

    test("fails with embedsDeprecated when timestamp is at cut-off", async () => {
      const data = Factories.CastAddData.build({
        timestamp: validations.EMBEDS_V1_CUTOFF,
        castAddBody: Factories.CastAddBody.build({ embeds: [], embedsDeprecated: [faker.internet.url()] }),
      });
      const result = await validations.validateMessageData(data);
      expect(result).toEqual(err(new HubError("bad_request.validation_failure", "string embeds have been deprecated")));
    });

    test("succeeds with embedsDeprecated when timestamp is before cut-off", async () => {
      const data = Factories.CastAddData.build({
        timestamp: validations.EMBEDS_V1_CUTOFF - 1,
        castAddBody: Factories.CastAddBody.build({ embeds: [], embedsDeprecated: [faker.internet.url()] }),
      });
      const result = await validations.validateMessageData(data);
      expect(result).toEqual(ok(data));
    });
  });
});
