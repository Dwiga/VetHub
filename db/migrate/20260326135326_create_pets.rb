class CreatePets < ActiveRecord::Migration[8.1]
  def change
    create_table :pets do |t|
      t.string :name
      t.references :species, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.date :birth_date
      t.integer :gender
      t.string :color
      t.string :rfid
      t.boolean :sterilized

      t.timestamps
    end
  end
end
