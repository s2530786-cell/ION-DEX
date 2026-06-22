from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.config import settings

engine = create_async_engine(
    settings.DB_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    echo=False
)
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
