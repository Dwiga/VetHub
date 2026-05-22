class DeletePicFromTreatment < ActiveRecord::Migration[8.1]
  def change
    remove_column :treatments, :pic, :string
  end
end
