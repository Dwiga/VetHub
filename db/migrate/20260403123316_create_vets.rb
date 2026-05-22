class CreateVets < ActiveRecord::Migration[8.1]
  def change
    create_table :vets do |t|
      t.string :name
      t.string :phone
      t.string :address
      t.string :email

      t.timestamps
    end
  end
end
