import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Influencer } from '../src/influencers/schemas/influencer.schema';

async function dropIndex() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const influencerModel = app.get<Model<Influencer>>(
      getModelToken(Influencer.name),
    );

    // List existing indexes
    const indexes = await influencerModel.collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index: any) => {
      console.log('  -', JSON.stringify(index));
    });

    // Drop the problematic index
    try {
      await influencerModel.collection.dropIndex('sourceCodes.code_1');
      console.log('\n✅ Successfully dropped index: sourceCodes.code_1');
    } catch (error: any) {
      if (error.codeName === 'IndexNotFound' || error.code === 27) {
        console.log('\n⚠️  Index sourceCodes.code_1 not found (may have been already dropped)');
      } else {
        throw error;
      }
    }

    // List indexes after dropping
    const indexesAfter = await influencerModel.collection.indexes();
    console.log('\n📋 Indexes after cleanup:');
    indexesAfter.forEach((index: any) => {
      console.log('  -', JSON.stringify(index));
    });

    console.log('\n✅ Done! You can now create influencers without the unique index error.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await app.close();
    console.log('\n🔌 Application context closed');
  }
}

dropIndex();
