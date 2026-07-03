

from sqlalchemy import text

import models
from database import Base, SessionLocal, engine
from security import generate_api_key


def run() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS screenshot BYTEA"))
        conn.execute(
            text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS viewed BOOLEAN NOT NULL DEFAULT FALSE")
        )
        conn.execute(
            text(
                "ALTER TABLE form_designs ADD COLUMN IF NOT EXISTS card_color VARCHAR NOT NULL DEFAULT '#FFFFFF'"
            )
        )
        conn.execute(text("ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS owner_email VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR"))
        conn.execute(text("ALTER TABLE form_designs ADD COLUMN IF NOT EXISTS owner_email VARCHAR"))
        conn.execute(text("ALTER TABLE form_designs DROP CONSTRAINT IF EXISTS form_designs_name_key"))
        conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'uq_form_designs_owner_name'
                    ) THEN
                        ALTER TABLE form_designs
                            ADD CONSTRAINT uq_form_designs_owner_name UNIQUE (owner_email, name);
                    END IF;
                END $$;
                """
            )
        )
        conn.execute(text("DELETE FROM feedbacks WHERE owner_email IS NULL"))
        conn.execute(text("DELETE FROM form_designs WHERE owner_email IS NULL"))

    db = SessionLocal()
    try:
        for user in db.query(models.User).filter(models.User.api_key.is_(None)).all():
            user.api_key = generate_api_key()
        db.commit()
    finally:
        db.close()

    print("Migration complete.")


if __name__ == "__main__":
    run()
