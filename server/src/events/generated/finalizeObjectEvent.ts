export interface FinalizeObjectEvent {
  /**
   * Content-Encoding of the object data, matching
   * [https://tools.ietf.org/html/rfc7231#section-3.1.2.2][RFC 7231 §3.1.2.2]
   *
   * @generated from protobuf field: string content_encoding = 1;
   */
  contentEncoding: string;
  /**
   * Content-Disposition of the object data, matching
   * [https://tools.ietf.org/html/rfc6266][RFC 6266].
   *
   * @generated from protobuf field: string content_disposition = 2;
   */
  contentDisposition: string;
  /**
   * Cache-Control directive for the object data, matching
   * [https://tools.ietf.org/html/rfc7234#section-5.2"][RFC 7234 §5.2].
   *
   * @generated from protobuf field: string cache_control = 3;
   */
  cacheControl: string;
  /**
   * Content-Language of the object data, matching
   * [https://tools.ietf.org/html/rfc7231#section-3.1.3.2][RFC 7231 §3.1.3.2].
   *
   * @generated from protobuf field: string content_language = 5;
   */
  contentLanguage: string;
  /**
   * The version of the metadata for this object at this generation. Used for
   * preconditions and for detecting changes in metadata. A metageneration
   * number is only meaningful in the context of a particular generation of a
   * particular object.
   *
   * @generated from protobuf field: int64 metageneration = 6;
   */
  metageneration: string;
  /**
   * The deletion time of the object. Will be returned if and only if this
   * version of the object has been deleted.
   *
   * @generated from protobuf field: google.protobuf.Timestamp time_deleted = 7;
   */
  timeDeleted?: Record<string, number>;
  /**
   * Content-Type of the object data, matching
   * [https://tools.ietf.org/html/rfc7231#section-3.1.1.5][RFC 7231 §3.1.1.5].
   * If an object is stored without a Content-Type, it is served as
   * `application/octet-stream`.
   *
   * @generated from protobuf field: string content_type = 8;
   */
  contentType: string;
  /**
   * Content-Length of the object data in bytes, matching
   * [https://tools.ietf.org/html/rfc7230#section-3.3.2][RFC 7230 §3.3.2].
   *
   * @generated from protobuf field: int64 size = 9;
   */
  size: string;
  /**
   * The creation time of the object.
   * Attempting to set this field will result in an error.
   *
   * @generated from protobuf field: google.protobuf.Timestamp time_created = 10;
   */
  timeCreated?: Record<string, number>;
  /**
   * CRC32c checksum. For more information about using the CRC32c
   * checksum, see
   * [https://cloud.google.com/storage/docs/hashes-etags#_JSONAPI][Hashes and
   * ETags: Best Practices].
   *
   * @generated from protobuf field: string crc32c = 11 [json_name = "crc32c"];
   */
  crc32C: string;
  /**
   * Number of underlying components that make up this object. Components are
   * accumulated by compose operations.
   * Attempting to set this field will result in an error.
   *
   * @generated from protobuf field: int32 component_count = 12;
   */
  componentCount: number;
  /**
   * MD5 hash of the data; encoded using base64 as per
   * [https://tools.ietf.org/html/rfc4648#section-4][RFC 4648 §4]. For more
   * information about using the MD5 hash, see
   * [https://cloud.google.com/storage/docs/hashes-etags#_JSONAPI][Hashes and
   * ETags: Best Practices].
   *
   * @generated from protobuf field: string md5_hash = 13;
   */
  md5Hash: string;
  /**
   * HTTP 1.1 Entity tag for the object. See
   * [https://tools.ietf.org/html/rfc7232#section-2.3][RFC 7232 §2.3].
   *
   * @generated from protobuf field: string etag = 14;
   */
  etag: string;
  /**
   * The modification time of the object metadata.
   *
   * @generated from protobuf field: google.protobuf.Timestamp updated = 15;
   */
  updated?: Record<string, number>;
  /**
   * Storage class of the object.
   *
   * @generated from protobuf field: string storage_class = 16;
   */
  storageClass: string;
  /**
   * Cloud KMS Key used to encrypt this object, if the object is encrypted by
   * such a key.
   *
   * @generated from protobuf field: string kms_key_name = 17;
   */
  kmsKeyName: string;
  /**
   * The time at which the object's storage class was last changed.
   *
   * @generated from protobuf field: google.protobuf.Timestamp time_storage_class_updated = 18;
   */
  timeStorageClassUpdated?: Record<string, number>;
  /**
   * Whether an object is under temporary hold.
   *
   * @generated from protobuf field: bool temporary_hold = 19;
   */
  temporaryHold: boolean;
  /**
   * A server-determined value that specifies the earliest time that the
   * object's retention period expires.
   *
   * @generated from protobuf field: google.protobuf.Timestamp retention_expiration_time = 20;
   */
  retentionExpirationTime?: Record<string, number>;
  /**
   * User-provided metadata, in key/value pairs.
   *
   * @generated from protobuf field: map<string, string> metadata = 21;
   */
  metadata: {
    [key: string]: string;
  };
  /**
   * Whether an object is under event-based hold.
   *
   * @generated from protobuf field: bool event_based_hold = 29;
   */
  eventBasedHold: boolean;
  /**
   * The name of the object.
   *
   * @generated from protobuf field: string name = 23;
   */
  name: string;
  /**
   * The ID of the object, including the bucket name, object name, and
   * generation number.
   *
   * @generated from protobuf field: string id = 24;
   */
  id: string;
  /**
   * The name of the bucket containing this object.
   *
   * @generated from protobuf field: string bucket = 25;
   */
  bucket: string;
  /**
   * The content generation of this object. Used for object versioning.
   * Attempting to set this field will result in an error.
   *
   * @generated from protobuf field: int64 generation = 26;
   */
  generation: string;
  /**
   * Metadata of customer-supplied encryption key, if the object is encrypted by
   * such a key.
   *
   * @generated from protobuf field: google.events.cloud.storage.v1.StorageObjectData.CustomerEncryption customer_encryption = 28;
   */
  customerEncryption?: string;
  /**
   * Media download link.
   *
   * @generated from protobuf field: string media_link = 100;
   */
  mediaLink: string;
  /**
   * The link to this object.
   *
   * @generated from protobuf field: string self_link = 101;
   */
  selfLink: string;
  /**
   * The kind of item this is. For objects, this is always "storage#object".
   *
   * @generated from protobuf field: string kind = 102;
   */
  kind: string;
}
