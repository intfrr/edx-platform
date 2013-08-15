from __future__ import absolute_import

import pymongo

from django.test import TestCase

from track.backends.mongodb import MongoBackend


class TestMongoBackend(TestCase):
    def setUp(self):
        database = '_track_backends_mongodb'
        collection = '_test'

        self.connection = pymongo.MongoClient()
        self.database = self.connection[database]
        self.collection = self.database[collection]

        # During tests, wait until mongo acknowledged the write
        write_concern = 1

        self.backend = MongoBackend(
            database=database,
            collection=collection,
            w=write_concern
        )

    def test_mongo_backend(self):
        self.backend.send({'test': 1})
        self.backend.send({'test': 2})

        # Get all the objects in the db ignoring _id
        results = list(self.collection.find({}, {'_id': False}))

        self.assertEqual(len(results), 2)
        self.assertEqual(results, [{'test': 1}, {'test': 2}])

    def tearDown(self):
        self.connection.drop_database(self.database)
