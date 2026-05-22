class CreateTreatments < ActiveRecord::Migration[8.1]
  def change
    create_table :treatments do |t|
      t.integer :type
      t.string :title
      t.string :description
      t.integer :pic
      t.float :fee

      t.timestamps
    end
  end
end
