class CreateSubTreatments < ActiveRecord::Migration[8.1]
  def change
    create_table :sub_treatments do |t|
      t.string :description
      t.references :user, null: false, foreign_key: true
      t.float :fee
      t.references :treatment, null: false, foreign_key: true

      t.timestamps
    end
  end
end
