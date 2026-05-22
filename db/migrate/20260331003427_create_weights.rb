class CreateWeights < ActiveRecord::Migration[8.1]
  def change
    create_table :weights do |t|
      t.float :weight
      t.references :pet, null: false, foreign_key: true

      t.timestamps
    end
  end
end
