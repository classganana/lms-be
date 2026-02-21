import { Injectable, Inject } from "@nestjs/common";
import {
  AggregateOptions,
  AnyBulkWriteOperation,
  BulkWriteOptions,
  CountDocumentsOptions,
  Db,
  DeleteOptions,
  Document,
  Filter,
  FindOptions,
  InsertOneOptions,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { Constants } from "../constants";

@Injectable()
export class MongoRepository {
  constructor(@Inject(Constants.MONGO_PROVIDER) protected db: Db) {}

  find(collection: string) {
    return this.db.collection(collection).find().toArray();
  }

  findOne(collection: string, filter: Filter<any>, options?: FindOptions) {
    return this.db.collection(collection).findOne(filter, options);
  }

  findAllMatching(
    collection: string,
    filter: Filter<any>,
    options?: FindOptions,
  ) {
    return this.db.collection(collection).find(filter, options).toArray();
  }

  updateOne(
    collection: string,
    filter: Filter<any>,
    update: UpdateFilter<any>,
    options?: UpdateOptions,
  ) {
    return this.db.collection(collection).updateOne(filter, update, options);
  }

  insertOne(
    collection: string,
    document: Document,
    options?: InsertOneOptions,
  ) {
    return this.db.collection(collection).insertOne(document, options);
  }

  insertMany(
    collection: string,
    documents: Array<Record<string, any>>,
    options?: BulkWriteOptions,
  ) {
    return this.db.collection(collection).insertMany(documents, options);
  }

  countDocuments(
    collection: string,
    filter?: Record<string, any>,
    options?: CountDocumentsOptions,
  ) {
    return this.db.collection(collection).countDocuments(filter, options);
  }

  bulkWrite(
    collection: string,
    operations: AnyBulkWriteOperation<Record<string, any>>[],
    options?: BulkWriteOptions,
  ) {
    return this.db.collection(collection).bulkWrite(operations, options);
  }

  deleteOne(collection: string, filter: Filter<any>, options?: DeleteOptions) {
    return this.db.collection(collection).deleteOne(filter, options);
  }

  aggregate(
    collection: string,
    pipeline?: Array<Record<string, any>>,
    options?: AggregateOptions,
  ) {
    return this.db
      .collection(collection)
      .aggregate(pipeline, options)
      .toArray();
  }

  deleteMany(
    collection: string,
    filter?: Filter<any>,
    options?: DeleteOptions,
  ) {
    return this.db.collection(collection).deleteMany(filter, options);
  }
}
